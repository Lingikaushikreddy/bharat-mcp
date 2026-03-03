/**
 * @bharat-mcp/shared — Common Zod Schemas for Indian Fintech Fields
 *
 * Reusable, LLM-friendly Zod schemas for validating Indian financial,
 * identity, and government data formats. Each schema includes a
 * `.describe()` annotation so that MCP tool descriptions are
 * auto-generated with human-readable (and LLM-readable) guidance.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// GSTIN — Goods and Services Tax Identification Number
// ---------------------------------------------------------------------------

/**
 * GSTIN format: 15-character alphanumeric string.
 *
 * Structure: `NNAAAAAANNNNANA`
 * - Positions 1–2:  State code (01–38)
 * - Positions 3–12: PAN of the entity
 * - Position 13:    Entity number (1–9 or A–Z)
 * - Position 14:    'Z' by default
 * - Position 15:    Check digit (alphanumeric)
 *
 * Example: "27AAPFU0939F1ZV"
 */
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const GstinSchema = z
  .string()
  .length(15, 'GSTIN must be exactly 15 characters')
  .regex(
    GSTIN_REGEX,
    'Invalid GSTIN format. Expected pattern: 2-digit state code + 10-char PAN + entity number + Z + check digit (e.g., "27AAPFU0939F1ZV")',
  )
  .toUpperCase()
  .describe(
    'Indian Goods and Services Tax Identification Number (GSTIN). ' +
      'A 15-character alphanumeric code uniquely identifying a GST-registered taxpayer. ' +
      'Format: 2-digit state code + PAN (10 chars) + entity number + "Z" + check digit. ' +
      'Example: "27AAPFU0939F1ZV".',
  );

export type Gstin = z.infer<typeof GstinSchema>;

// ---------------------------------------------------------------------------
// UPI VPA — Unified Payments Interface Virtual Payment Address
// ---------------------------------------------------------------------------

export const UPI_VPA_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9.\-]{2,}@[a-zA-Z][a-zA-Z0-9]{2,}$/;

export const UpiVpaSchema = z
  .string()
  .min(7, 'UPI VPA must be at least 7 characters (e.g., "abc@upi")')
  .max(100, 'UPI VPA must not exceed 100 characters')
  .regex(
    UPI_VPA_REGEX,
    'Invalid UPI VPA format. Expected "username@provider" (e.g., "john.doe@okicici")',
  )
  .toLowerCase()
  .describe(
    'UPI Virtual Payment Address (VPA) in the format "username@provider". ' +
      'The username is 3+ alphanumeric characters (dots and hyphens allowed). ' +
      'The provider is a registered PSP handle like "okicici", "ybl", "paytm", or "upi". ' +
      'Example: "merchant.store@okicici".',
  );

export type UpiVpa = z.infer<typeof UpiVpaSchema>;

// ---------------------------------------------------------------------------
// PAN — Permanent Account Number
// ---------------------------------------------------------------------------

export const PAN_REGEX = /^[A-Z]{3}[ABCFGHLJPT][A-Z][0-9]{4}[A-Z]$/;

export const PanSchema = z
  .string()
  .length(10, 'PAN must be exactly 10 characters')
  .regex(
    PAN_REGEX,
    'Invalid PAN format. Expected 5 letters (4th must be entity type: A/B/C/F/G/H/J/L/P/T) + 4 digits + 1 letter (e.g., "ABCPD1234E")',
  )
  .toUpperCase()
  .describe(
    'Indian Permanent Account Number (PAN) issued by the Income Tax Department. ' +
      'A 10-character alphanumeric code: 3 letters + entity type letter + name letter + 4 digits + check letter. ' +
      'The 4th character indicates entity type (P=Person, C=Company, H=HUF, F=Firm, etc.). ' +
      'Example: "ABCPD1234E".',
  );

export type Pan = z.infer<typeof PanSchema>;

// ---------------------------------------------------------------------------
// Aadhaar Number
// ---------------------------------------------------------------------------

export const AADHAAR_REGEX = /^[2-9][0-9]{11}$/;

export const AadhaarSchema = z
  .string()
  .length(12, 'Aadhaar number must be exactly 12 digits')
  .regex(
    AADHAAR_REGEX,
    'Invalid Aadhaar format. Must be 12 digits starting with 2-9 (e.g., "234567890123")',
  )
  .describe(
    'Indian Aadhaar number — a 12-digit unique identity number issued by UIDAI. ' +
      'Starts with a digit 2–9 (never 0 or 1). ' +
      'WARNING: Aadhaar is sensitive PII. Handle with zero-trust. Never log or cache. ' +
      'Example: "234567890123".',
  );

export type Aadhaar = z.infer<typeof AadhaarSchema>;

// ---------------------------------------------------------------------------
// Amount in Paise — INR smallest currency unit
// ---------------------------------------------------------------------------

export const AmountInPaiseSchema = z
  .number()
  .int('Amount must be a whole number (no decimals) — value is in paise')
  .positive('Amount must be a positive integer in paise')
  .min(100, 'Minimum amount is 100 paise (INR 1.00)')
  .max(10_000_000_00, 'Maximum amount is 10,00,00,000 paise (INR 1,00,00,000 / 1 crore)')
  .describe(
    'Amount in Indian paise (smallest INR unit). 1 INR = 100 paise. ' +
      'Must be a positive integer >= 100 (INR 1.00). ' +
      'Example: 50000 = INR 500.00.',
  );

export type AmountInPaise = z.infer<typeof AmountInPaiseSchema>;

// ---------------------------------------------------------------------------
// Currency — INR literal
// ---------------------------------------------------------------------------

export const CurrencySchema = z
  .literal('INR')
  .default('INR')
  .describe(
    'ISO 4217 currency code. Currently only "INR" (Indian Rupee) is supported. ' +
      'Defaults to "INR" if not specified.',
  );

export type Currency = z.infer<typeof CurrencySchema>;

// ---------------------------------------------------------------------------
// Idempotency Key — UUIDv4 for mutation safety
// ---------------------------------------------------------------------------

export const IdempotencyKeySchema = z
  .string()
  .uuid('Idempotency key must be a valid UUIDv4 string')
  .describe(
    'Unique idempotency key (UUIDv4) to prevent duplicate mutations. ' +
      'Generate a new UUID for each distinct operation. Reuse the same UUID when retrying. ' +
      'Required for all write/mutation operations (create order, trigger refund, etc.). ' +
      'Example: "550e8400-e29b-41d4-a716-446655440000".',
  );

export type IdempotencyKeyValue = z.infer<typeof IdempotencyKeySchema>;

// ---------------------------------------------------------------------------
// Pagination — skip/count with sensible defaults
// ---------------------------------------------------------------------------

export const PaginationSchema = z.object({
  skip: z
    .number()
    .int()
    .min(0, 'skip must be >= 0')
    .default(0)
    .describe('Number of records to skip (offset for pagination). Defaults to 0.'),
  count: z
    .number()
    .int()
    .min(1, 'count must be >= 1')
    .max(100, 'count must be <= 100 per page')
    .default(10)
    .describe('Number of records to return per page. Defaults to 10, maximum 100.'),
});

export type Pagination = z.infer<typeof PaginationSchema>;

// ---------------------------------------------------------------------------
// Date Range — ISO 8601 date strings for filtering
// ---------------------------------------------------------------------------

export const DateRangeSchema = z
  .object({
    from: z
      .string()
      .datetime({ message: 'from must be a valid ISO 8601 datetime string' })
      .optional()
      .describe(
        'Start of the date range (inclusive) as an ISO 8601 datetime string. ' +
          'Example: "2025-01-01T00:00:00Z". Omit for an open start.',
      ),
    to: z
      .string()
      .datetime({ message: 'to must be a valid ISO 8601 datetime string' })
      .optional()
      .describe(
        'End of the date range (inclusive) as an ISO 8601 datetime string. ' +
          'Example: "2025-12-31T23:59:59Z". Omit for an open end.',
      ),
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        return new Date(data.from) <= new Date(data.to);
      }
      return true;
    },
    {
      message: '"from" date must be before or equal to "to" date',
      path: ['from'],
    },
  );

export type DateRange = z.infer<typeof DateRangeSchema>;

// ---------------------------------------------------------------------------
// Indian Phone Number — +91 format
// ---------------------------------------------------------------------------

export const PHONE_NUMBER_REGEX = /^\+91[6-9][0-9]{9}$/;

export const PhoneNumberSchema = z
  .string()
  .regex(
    PHONE_NUMBER_REGEX,
    'Invalid Indian phone number. Must be in +91XXXXXXXXXX format where X starts with 6-9 (e.g., "+919876543210")',
  )
  .describe(
    'Indian mobile phone number in E.164 format "+91XXXXXXXXXX". ' +
      'Must be exactly 13 characters: "+91" prefix followed by a 10-digit number starting with 6–9. ' +
      'Example: "+919876543210".',
  );

export type PhoneNumber = z.infer<typeof PhoneNumberSchema>;

// ---------------------------------------------------------------------------
// IFSC Code — Indian Financial System Code
// ---------------------------------------------------------------------------

export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export const IfscCodeSchema = z
  .string()
  .length(11, 'IFSC code must be exactly 11 characters')
  .regex(
    IFSC_REGEX,
    'Invalid IFSC code format. Expected 4 letters + "0" + 6 alphanumeric chars (e.g., "SBIN0001234")',
  )
  .toUpperCase()
  .describe(
    'Indian Financial System Code (IFSC) identifying a bank branch. ' +
      '11 characters: 4-letter bank code + "0" + 6-char branch code. ' +
      'Example: "SBIN0001234" (State Bank of India).',
  );

export type IfscCode = z.infer<typeof IfscCodeSchema>;

// ---------------------------------------------------------------------------
// Financial Year — Indian format (e.g., "2024-25")
// ---------------------------------------------------------------------------

export const FINANCIAL_YEAR_REGEX = /^[0-9]{4}-[0-9]{2}$/;

export const FinancialYearSchema = z
  .string()
  .regex(FINANCIAL_YEAR_REGEX, 'Invalid financial year format. Expected "YYYY-YY" (e.g., "2024-25")')
  .refine(
    (fy) => {
      const [startStr, endStr] = fy.split('-');
      const startYear = parseInt(startStr!, 10);
      const endYearSuffix = parseInt(endStr!, 10);
      const expectedEndSuffix = (startYear + 1) % 100;
      return endYearSuffix === expectedEndSuffix;
    },
    {
      message:
        'Financial year end must be exactly one year after start (e.g., "2024-25", not "2024-26")',
    },
  )
  .describe(
    'Indian financial year in "YYYY-YY" format (April to March). ' +
      'The second part must be the last 2 digits of start year + 1. ' +
      'Example: "2024-25" represents April 2024 to March 2025.',
  );

export type FinancialYear = z.infer<typeof FinancialYearSchema>;
