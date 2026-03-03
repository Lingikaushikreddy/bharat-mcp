/**
 * @bharat-mcp/shared — Schemas Barrel Export
 */

// Common Indian Fintech Schemas
export {
  GSTIN_REGEX,
  GstinSchema,
  type Gstin,
  UPI_VPA_REGEX,
  UpiVpaSchema,
  type UpiVpa,
  PAN_REGEX,
  PanSchema,
  type Pan,
  AADHAAR_REGEX,
  AadhaarSchema,
  type Aadhaar,
  AmountInPaiseSchema,
  type AmountInPaise,
  CurrencySchema,
  type Currency,
  IdempotencyKeySchema,
  type IdempotencyKeyValue,
  PaginationSchema,
  type Pagination,
  DateRangeSchema,
  type DateRange,
  PHONE_NUMBER_REGEX,
  PhoneNumberSchema,
  type PhoneNumber,
  IFSC_REGEX,
  IfscCodeSchema,
  type IfscCode,
  FINANCIAL_YEAR_REGEX,
  FinancialYearSchema,
  type FinancialYear,
} from './common.js';

// Tool Handler Wrapper
export {
  createToolHandler,
  formatToolResultForMcp,
  type CreateToolHandlerOptions,
} from './tool-wrapper.js';
