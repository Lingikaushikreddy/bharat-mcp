/**
 * @bharat-mcp/shared — Shared Utilities
 *
 * Crypto-based ID generation, PII masking, and idempotency key validation.
 */

import { randomUUID } from 'node:crypto';
import { type IdempotencyKey, IDEMPOTENCY_KEY_PATTERN } from '../types/index.js';

// ---------------------------------------------------------------------------
// Trace ID Generation
// ---------------------------------------------------------------------------

export function generateTraceId(): string {
  return randomUUID();
}

// ---------------------------------------------------------------------------
// PII / Sensitive Data Masking
// ---------------------------------------------------------------------------

const SENSITIVE_FIELDS = new Set([
  'password',
  'secret',
  'token',
  'apikey',
  'api_key',
  'authorization',
  'aadhaar',
  'pan',
  'accountnumber',
  'account_number',
  'creditcard',
  'credit_card',
]);

export function maskSensitiveData(
  data: unknown,
  maxDepth: number = 10,
): unknown {
  return maskRecursive(data, 0, maxDepth);
}

function maskRecursive(
  value: unknown,
  currentDepth: number,
  maxDepth: number,
): unknown {
  if (currentDepth > maxDepth) {
    return '[MAX_DEPTH_EXCEEDED]';
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => maskRecursive(item, currentDepth + 1, maxDepth));
  }

  if (typeof value === 'object' && value !== null) {
    const masked: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
        masked[key] = maskValue(val);
      } else {
        masked[key] = maskRecursive(val, currentDepth + 1, maxDepth);
      }
    }
    return masked;
  }

  return value;
}

function maskValue(value: unknown): string {
  if (typeof value === 'string') {
    if (value.length <= 4) {
      return '****';
    }
    return '****' + value.slice(-4);
  }
  return '[REDACTED]';
}

// ---------------------------------------------------------------------------
// Idempotency Key Validation
// ---------------------------------------------------------------------------

export function validateIdempotencyKey(key: string): IdempotencyKey {
  if (!IDEMPOTENCY_KEY_PATTERN.test(key)) {
    throw new Error(
      `Invalid idempotency key: "${key}". Must be a valid UUIDv4 string.`,
    );
  }
  return key as IdempotencyKey;
}
