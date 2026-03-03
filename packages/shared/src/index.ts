/**
 * @bharat-mcp/shared — Barrel Export
 *
 * Re-exports everything from submodules for convenient single-import usage:
 *   import { McpError, createLogger, generateTraceId } from "@bharat-mcp/shared";
 */

// Types
export type {
  ToolExecutionContext,
  CallerInfo,
  ToolResult,
  ToolSuccess,
  ToolError,
  ToolErrorDetail,
  ServerConfig,
  LogLevel,
  ApiClientConfig,
  IdempotencyKey,
} from './types/index.js';

export { IDEMPOTENCY_KEY_PATTERN } from './types/index.js';

// Errors
export {
  ErrorCode,
  McpError,
  ApiError,
  ValidationError,
  RateLimitError,
  AuthenticationError,
  IdempotencyError,
  isMcpError,
} from './errors/index.js';

export type {
  SerializedMcpError,
  ApiErrorContext,
  ValidationIssue,
} from './errors/index.js';

// Logger
export { createLogger, createChildLogger } from './logger/index.js';
export type { Logger } from './logger/index.js';

// Utilities
export {
  generateTraceId,
  maskSensitiveData,
  validateIdempotencyKey,
} from './utils/index.js';

// Schemas
export {
  GSTIN_REGEX,
  GstinSchema,
  UPI_VPA_REGEX,
  UpiVpaSchema,
  PAN_REGEX,
  PanSchema,
  AADHAAR_REGEX,
  AadhaarSchema,
  AmountInPaiseSchema,
  CurrencySchema,
  IdempotencyKeySchema,
  PaginationSchema,
  DateRangeSchema,
  PHONE_NUMBER_REGEX,
  PhoneNumberSchema,
  IFSC_REGEX,
  IfscCodeSchema,
  FINANCIAL_YEAR_REGEX,
  FinancialYearSchema,
  createToolHandler,
  formatToolResultForMcp,
} from './schemas/index.js';

export type {
  Gstin,
  UpiVpa,
  Pan,
  Aadhaar,
  AmountInPaise,
  Currency,
  IdempotencyKeyValue,
  Pagination,
  DateRange,
  PhoneNumber,
  IfscCode,
  FinancialYear,
  CreateToolHandlerOptions,
} from './schemas/index.js';
