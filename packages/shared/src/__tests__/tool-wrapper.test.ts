import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ApiError, createLogger, createToolHandler, formatToolResultForMcp } from '../index.js';

const logger = createLogger('test', { level: 'silent' });

describe('createToolHandler', () => {
  const handle = createToolHandler({
    name: 'double',
    schema: z.object({ n: z.number() }),
    handler: async ({ n }) => ({ doubled: n * 2 }),
    logger,
  });

  it('wraps a successful result with a trace id', async () => {
    const result = await handle({ n: 21 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ doubled: 42 });
      expect(result.traceId).toBeTruthy();
    }
  });

  it('returns a validation error instead of throwing', async () => {
    const result = await handle({ n: 'nope' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.statusCode).toBe(400);
    }
  });

  it('maps McpError subclasses to their code and status', async () => {
    const failing = createToolHandler({
      name: 'failing',
      schema: z.object({}),
      handler: async () => {
        throw new ApiError('upstream failed', { httpStatus: 502 });
      },
      logger,
    });
    const result = await failing({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('API_ERROR');
      expect(result.error.statusCode).toBe(502);
    }
  });
});

describe('formatToolResultForMcp', () => {
  it('marks failures as MCP errors', () => {
    const formatted = formatToolResultForMcp({
      success: false,
      error: { code: 'API_ERROR', message: 'x' },
      traceId: 't',
      timestamp: 'now',
    });
    expect(formatted.isError).toBe(true);
    expect(formatted.content[0]?.type).toBe('text');
  });
});
