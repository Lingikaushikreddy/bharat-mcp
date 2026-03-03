/**
 * @bharat-mcp/shared — Structured Logger
 *
 * Factory functions wrapping pino with:
 * - Structured JSON output
 * - PII / secret redaction (India-specific fields included)
 * - Trace ID injection
 * - Child logger creation for per-request context
 */

import pino, { type Logger, type LoggerOptions } from 'pino';
import type { LogLevel } from '../types/index.js';

// ---------------------------------------------------------------------------
// Redaction paths — fields that must NEVER appear in logs
// ---------------------------------------------------------------------------

const REDACT_PATHS: string[] = [
  'password',
  'secret',
  'token',
  'apiKey',
  'api_key',
  'authorization',
  'aadhaar',
  'pan',
  'accountNumber',
  'account_number',
  'creditCard',
  'credit_card',

  '*.password',
  '*.secret',
  '*.token',
  '*.apiKey',
  '*.api_key',
  '*.authorization',
  '*.aadhaar',
  '*.pan',
  '*.accountNumber',
  '*.account_number',
  '*.creditCard',
  '*.credit_card',

  '*.*.password',
  '*.*.secret',
  '*.*.token',
  '*.*.apiKey',
  '*.*.api_key',
  '*.*.authorization',
  '*.*.aadhaar',
  '*.*.pan',
  '*.*.accountNumber',
  '*.*.account_number',
  '*.*.creditCard',
  '*.*.credit_card',
];

// ---------------------------------------------------------------------------
// Factory: createLogger
// ---------------------------------------------------------------------------

export function createLogger(
  serverName: string,
  options: { level?: LogLevel; base?: Record<string, unknown> } = {},
): Logger {
  const level = options.level ?? (process.env.LOG_LEVEL as LogLevel) ?? 'info';

  const pinoOptions: LoggerOptions = {
    name: serverName,
    level,
    base: {
      server: serverName,
      pid: process.pid,
      ...options.base,
    },
    redact: {
      paths: REDACT_PATHS,
      censor: '[REDACTED]',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },
  };

  return pino(pinoOptions);
}

// ---------------------------------------------------------------------------
// Factory: createChildLogger
// ---------------------------------------------------------------------------

export function createChildLogger(
  parent: Logger,
  context: Record<string, unknown>,
): Logger {
  return parent.child(context);
}

export type { Logger } from 'pino';
