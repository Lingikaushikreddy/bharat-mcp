/**
 * @bharat-mcp/shared — MCP Tool Handler Wrapper
 *
 * A higher-order function that wraps MCP tool handler logic with:
 * - Automatic Zod input validation (ZodError -> ValidationError mapping)
 * - Trace ID generation and injection into ToolExecutionContext
 * - Structured ToolResult<T> envelope wrapping (success/error)
 * - Audit logging of every tool call (input, output, duration, errors)
 * - Error normalization for all uncaught exceptions
 * - Timing / duration measurement for observability
 */

import { z } from 'zod';
import type { Logger } from 'pino';
import type { ToolExecutionContext, ToolResult, ToolSuccess, ToolError } from '../types/index.js';
import { ValidationError, isMcpError, ErrorCode } from '../errors/index.js';
import { generateTraceId, maskSensitiveData } from '../utils/index.js';

// ---------------------------------------------------------------------------
// Tool Handler Options
// ---------------------------------------------------------------------------

export interface CreateToolHandlerOptions<TInput, TOutput> {
  /** Tool name for audit logging. Should match the MCP tool registration name. */
  name: string;

  /** Zod schema for validating raw input. Supports custom refinements. */
  schema: z.ZodType<TInput>;

  /** Async handler containing the tool's business logic. */
  handler: (input: TInput, context: ToolExecutionContext) => Promise<TOutput>;

  /** Pino logger instance for structured audit logging. */
  logger: Logger;
}

// ---------------------------------------------------------------------------
// Context & Result Builders
// ---------------------------------------------------------------------------

function createExecutionContext(): ToolExecutionContext {
  return {
    traceId: generateTraceId(),
    timestamp: new Date().toISOString(),
  };
}

function buildSuccess<T>(data: T, context: ToolExecutionContext): ToolSuccess<T> {
  return {
    success: true,
    data,
    traceId: context.traceId,
    timestamp: context.timestamp,
  };
}

function buildError(
  code: string,
  message: string,
  context: ToolExecutionContext,
  statusCode?: number,
  retryAfter?: number,
): ToolError {
  return {
    success: false,
    error: { code, message, statusCode, retryAfter },
    traceId: context.traceId,
    timestamp: context.timestamp,
  };
}

// ---------------------------------------------------------------------------
// Error Classification
// ---------------------------------------------------------------------------

function classifyError(error: unknown, context: ToolExecutionContext): ToolError {
  if (error instanceof ValidationError) {
    return buildError(ErrorCode.VALIDATION_ERROR, error.message, context, 400);
  }

  if (isMcpError(error)) {
    return buildError(
      error.code,
      error.message,
      context,
      error.statusCode,
      (error as { retryAfter?: number }).retryAfter,
    );
  }

  const message =
    error instanceof Error ? error.message : 'An unexpected internal error occurred';

  return buildError(ErrorCode.INTERNAL_ERROR, message, context, 500);
}

// ---------------------------------------------------------------------------
// createToolHandler
// ---------------------------------------------------------------------------

/**
 * Creates a wrapped MCP tool handler with built-in validation, tracing,
 * audit logging, error handling, and result envelope wrapping.
 *
 * @example
 * ```typescript
 * const handleCreateOrder = createToolHandler({
 *   name: 'create_order',
 *   schema: z.object({
 *     amount: AmountInPaiseSchema,
 *     idempotency_key: IdempotencyKeySchema,
 *   }),
 *   handler: async (input, context) => {
 *     const order = await razorpayClient.createOrder(input);
 *     return order;
 *   },
 *   logger,
 * });
 * ```
 */
export function createToolHandler<TInput, TOutput>(
  options: CreateToolHandlerOptions<TInput, TOutput>,
): (rawInput: unknown) => Promise<ToolResult<TOutput>> {
  const { name, schema, handler, logger } = options;

  return async (rawInput: unknown): Promise<ToolResult<TOutput>> => {
    const context = createExecutionContext();
    const startTime = performance.now();
    const childLogger = logger.child({ tool: name, traceId: context.traceId });

    childLogger.info(
      { event: 'tool_call_start', input: maskSensitiveData(rawInput) },
      `Tool "${name}" invoked`,
    );

    try {
      // Step 1: Validate input with Zod
      const parseResult = schema.safeParse(rawInput);

      if (!parseResult.success) {
        const validationError = ValidationError.fromZodError(parseResult.error);
        const duration = performance.now() - startTime;

        childLogger.warn(
          { event: 'tool_call_validation_error', duration, issues: validationError.issues },
          `Tool "${name}" input validation failed`,
        );

        return buildError(ErrorCode.VALIDATION_ERROR, validationError.message, context, 400);
      }

      const validatedInput: TInput = parseResult.data;

      // Step 2: Execute business logic
      const output = await handler(validatedInput, context);
      const duration = performance.now() - startTime;

      childLogger.info(
        { event: 'tool_call_success', duration },
        `Tool "${name}" completed successfully in ${duration.toFixed(1)}ms`,
      );

      return buildSuccess(output, context);
    } catch (error: unknown) {
      const duration = performance.now() - startTime;
      const toolError = classifyError(error, context);

      childLogger.error(
        {
          event: 'tool_call_error',
          duration,
          errorCode: toolError.error.code,
          errorMessage: toolError.error.message,
          statusCode: toolError.error.statusCode,
          err: error instanceof Error ? error : undefined,
        },
        `Tool "${name}" failed with ${toolError.error.code} in ${duration.toFixed(1)}ms`,
      );

      return toolError;
    }
  };
}

// ---------------------------------------------------------------------------
// formatToolResultForMcp — ToolResult -> MCP CallToolResult
// ---------------------------------------------------------------------------

/**
 * Converts a ToolResult<T> envelope into the MCP CallToolResult format.
 *
 * @example
 * ```typescript
 * server.tool('create_order', inputShape, async (args) => {
 *   const result = await handleCreateOrder(args);
 *   return formatToolResultForMcp(result);
 * });
 * ```
 */
export function formatToolResultForMcp<T>(
  result: ToolResult<T>,
): { content: Array<{ type: 'text'; text: string }>; isError: boolean } {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
    isError: !result.success,
  };
}
