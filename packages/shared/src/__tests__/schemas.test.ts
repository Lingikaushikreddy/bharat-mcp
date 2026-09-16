import { describe, expect, it } from 'vitest';
import { AmountInPaiseSchema, GstinSchema, IdempotencyKeySchema, UpiVpaSchema } from '../index.js';

describe('GstinSchema', () => {
  it('accepts a valid GSTIN and upper-cases it', () => {
    expect(GstinSchema.parse('27AAPFU0939F1ZV')).toBe('27AAPFU0939F1ZV');
  });

  it('rejects a GSTIN with the wrong shape', () => {
    expect(GstinSchema.safeParse('27AAPFU0939F1XV').success).toBe(false);
    expect(GstinSchema.safeParse('27AAPFU0939F1Z').success).toBe(false);
  });
});

describe('UpiVpaSchema', () => {
  it('accepts username@provider with dots and hyphens', () => {
    expect(UpiVpaSchema.parse('merchant.store-1@okicici')).toBe('merchant.store-1@okicici');
  });

  it('rejects an address without a provider', () => {
    expect(UpiVpaSchema.safeParse('merchantstore').success).toBe(false);
  });
});

describe('AmountInPaiseSchema', () => {
  it('accepts whole paise at or above the minimum', () => {
    expect(AmountInPaiseSchema.parse(100)).toBe(100);
  });

  it('rejects fractional and below-minimum amounts', () => {
    expect(AmountInPaiseSchema.safeParse(150.5).success).toBe(false);
    expect(AmountInPaiseSchema.safeParse(99).success).toBe(false);
  });
});

describe('IdempotencyKeySchema', () => {
  it('requires a UUID', () => {
    expect(IdempotencyKeySchema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(
      true,
    );
    expect(IdempotencyKeySchema.safeParse('not-a-uuid').success).toBe(false);
  });
});
