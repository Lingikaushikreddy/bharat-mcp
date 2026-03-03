/**
 * @bharat-mcp/shared — MCP Base Types
 *
 * Core type definitions for tool execution context, result wrappers,
 * server/API configuration, and idempotency.
 */

// ---------------------------------------------------------------------------
// Tool Execution Context
// ---------------------------------------------------------------------------

export interface ToolExecutionContext {
  /** Unique trace ID for end-to-end request correlation (UUIDv4). */
  traceId: string;

  /** ISO-8601 timestamp when the tool execution started. */
  timestamp: string;

  /** Identifier of the calling agent / client (if available). */
  callerInfo?: CallerInfo;
}

export interface CallerInfo {
  /** Name or ID of the calling MCP client (e.g., "claude-desktop"). */
  clientId?: string;

  /** Session or conversation identifier from the upstream LLM. */
  sessionId?: string;

  /** The model name making the tool call, if known. */
  modelId?: string;
}

// ---------------------------------------------------------------------------
// Tool Result Wrappers (Success / Error Envelopes)
// ---------------------------------------------------------------------------

export type ToolResult<T> = ToolSuccess<T> | ToolError;

export interface ToolSuccess<T> {
  success: true;
  data: T;
  traceId: string;
  timestamp: string;
}

export interface ToolError {
  success: false;
  error: ToolErrorDetail;
  traceId: string;
  timestamp: string;
}

export interface ToolErrorDetail {
  /** Machine-readable error code (e.g., "RATE_LIMIT_EXCEEDED"). */
  code: string;

  /** Human-readable error message. */
  message: string;

  /** HTTP status code from the upstream API, if applicable. */
  statusCode?: number;

  /** Seconds until retry is safe (for rate-limit errors). */
  retryAfter?: number;
}

// ---------------------------------------------------------------------------
// Configuration Types
// ---------------------------------------------------------------------------

export interface ServerConfig {
  /** Human-readable server name (e.g., "mcp-server-razorpay"). */
  name: string;

  /** Semantic version of this server. */
  version: string;

  /** Transport mode. */
  transport: 'stdio' | 'sse';

  /** Log level override. Defaults to "info". */
  logLevel?: LogLevel;

  /** Optional port for SSE transport. */
  port?: number;

  /** Optional host binding for SSE transport. */
  host?: string;
}

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface ApiClientConfig {
  /** Base URL of the upstream API (no trailing slash). */
  baseUrl: string;

  /** Request timeout in milliseconds. Defaults to 30_000. */
  timeoutMs?: number;

  /** Maximum number of automatic retries on transient failures. Defaults to 3. */
  maxRetries?: number;

  /** Base delay in ms for exponential backoff between retries. Defaults to 1_000. */
  retryBaseDelayMs?: number;

  /** HTTP headers to include in every request. */
  defaultHeaders?: Record<string, string>;

  /** Whether to operate against a sandbox/test environment. */
  sandbox?: boolean;
}

// ---------------------------------------------------------------------------
// Idempotency
// ---------------------------------------------------------------------------

export type IdempotencyKey = string & { readonly __brand: 'IdempotencyKey' };

export const IDEMPOTENCY_KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
