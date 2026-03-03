/**
 * @bharat-mcp/shared — Custom Error Hierarchy
 *
 * All errors extend McpError and are JSON-serializable for structured logging
 * and transport over the MCP protocol.
 */

// ---------------------------------------------------------------------------
// Error Codes
// ---------------------------------------------------------------------------

export const ErrorCode = {
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  API_ERROR: 'API_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// ---------------------------------------------------------------------------
// Serializable shape
// ---------------------------------------------------------------------------

export interface SerializedMcpError {
  name: string;
  code: ErrorCode;
  message: string;
  statusCode: number;
  context?: Record<string, unknown>;
  stack?: string;
}

// ---------------------------------------------------------------------------
// Base Error
// ---------------------------------------------------------------------------

export class McpError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly context: Record<string, unknown>;

  constructor(
    message: string,
    options: {
      code?: ErrorCode;
      statusCode?: number;
      context?: Record<string, unknown>;
      cause?: unknown;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'McpError';
    this.code = options.code ?? ErrorCode.INTERNAL_ERROR;
    this.statusCode = options.statusCode ?? 500;
    this.context = options.context ?? {};

    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON(): SerializedMcpError {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      context: Object.keys(this.context).length > 0 ? this.context : undefined,
      stack: this.stack,
    };
  }
}

// ---------------------------------------------------------------------------
// API Error — upstream HTTP failures
// ---------------------------------------------------------------------------

export interface ApiErrorContext {
  httpStatus: number;
  responseBody?: unknown;
  url?: string;
  method?: string;
}

export class ApiError extends McpError {
  public readonly httpStatus: number;
  public readonly responseBody: unknown;

  constructor(
    message: string,
    options: {
      httpStatus: number;
      responseBody?: unknown;
      url?: string;
      method?: string;
      cause?: unknown;
    },
  ) {
    super(message, {
      code: ErrorCode.API_ERROR,
      statusCode: options.httpStatus,
      context: {
        httpStatus: options.httpStatus,
        responseBody: options.responseBody,
        url: options.url,
        method: options.method,
      },
      cause: options.cause,
    });
    this.name = 'ApiError';
    this.httpStatus = options.httpStatus;
    this.responseBody = options.responseBody;
  }
}

// ---------------------------------------------------------------------------
// Validation Error — Zod schema failures
// ---------------------------------------------------------------------------

export interface ValidationIssue {
  path: (string | number)[];
  message: string;
  code: string;
}

export class ValidationError extends McpError {
  public readonly issues: ValidationIssue[];

  constructor(
    message: string,
    options: {
      issues: ValidationIssue[];
      cause?: unknown;
    },
  ) {
    super(message, {
      code: ErrorCode.VALIDATION_ERROR,
      statusCode: 400,
      context: { issues: options.issues },
      cause: options.cause,
    });
    this.name = 'ValidationError';
    this.issues = options.issues;
  }

  static fromZodError(zodError: {
    issues: Array<{ path: (string | number)[]; message: string; code: string }>;
    message: string;
  }): ValidationError {
    const issues: ValidationIssue[] = zodError.issues.map((i) => ({
      path: i.path,
      message: i.message,
      code: i.code,
    }));
    return new ValidationError(zodError.message, { issues, cause: zodError });
  }
}

// ---------------------------------------------------------------------------
// Rate Limit Error
// ---------------------------------------------------------------------------

export class RateLimitError extends McpError {
  public readonly retryAfter: number;

  constructor(
    message: string,
    options: {
      retryAfter: number;
      cause?: unknown;
    },
  ) {
    super(message, {
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      statusCode: 429,
      context: { retryAfter: options.retryAfter },
      cause: options.cause,
    });
    this.name = 'RateLimitError';
    this.retryAfter = options.retryAfter;
  }
}

// ---------------------------------------------------------------------------
// Authentication Error
// ---------------------------------------------------------------------------

export class AuthenticationError extends McpError {
  constructor(
    message: string,
    options: {
      context?: Record<string, unknown>;
      cause?: unknown;
    } = {},
  ) {
    super(message, {
      code: ErrorCode.AUTHENTICATION_ERROR,
      statusCode: 401,
      context: options.context ?? {},
      cause: options.cause,
    });
    this.name = 'AuthenticationError';
  }
}

// ---------------------------------------------------------------------------
// Idempotency Error — duplicate request detection
// ---------------------------------------------------------------------------

export class IdempotencyError extends McpError {
  public readonly idempotencyKey: string;

  constructor(
    message: string,
    options: {
      idempotencyKey: string;
      cause?: unknown;
    },
  ) {
    super(message, {
      code: ErrorCode.IDEMPOTENCY_CONFLICT,
      statusCode: 409,
      context: { idempotencyKey: options.idempotencyKey },
      cause: options.cause,
    });
    this.name = 'IdempotencyError';
    this.idempotencyKey = options.idempotencyKey;
  }
}

// ---------------------------------------------------------------------------
// Type guard
// ---------------------------------------------------------------------------

export function isMcpError(error: unknown): error is McpError {
  return error instanceof McpError;
}
