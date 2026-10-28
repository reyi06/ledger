import { z } from 'zod';

/**
 * Money is stored as a signed integer number of minor units ("cents").
 *
 * Floating point currency is a classic source of rounding bugs, so the raw
 * `number` is wrapped in a Zod-branded type: you cannot pass an arbitrary
 * number where `Cents` is expected. All arithmetic goes through the helpers
 * below, which round and re-validate, so a `Cents` value is always a safe
 * integer.
 */

export const CentsSchema = z.number().int().brand<'Cents'>();
export type Cents = z.infer<typeof CentsSchema>;

export const ZERO = 0 as Cents;

/** Anything beyond this is treated as a typo in a form field. */
export const MAX_AMOUNT = 100_000_000_000; // 1 billion dollars, in cents

function assertFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${label} must be a finite number, received ${value}`);
  }
}

/** Build a `Cents` value from an integer count of minor units. */
export function cents(value: number): Cents {
  assertFinite(value, 'cents');
  return CentsSchema.parse(Math.round(value));
}

/** Build a `Cents` value from a decimal amount, for example `19.99` -> `1999`. */
export function dollarsToCents(amount: number): Cents {
  assertFinite(amount, 'amount');
  return cents(amount * 100);
}

/** Convert back to a decimal amount for display or input fields. */
export function centsToDollars(value: Cents): number {
  return value / 100;
}

export function addCents(...values: readonly Cents[]): Cents {
  return cents(values.reduce<number>((total, value) => total + value, 0));
}

export function sumCents(values: readonly Cents[]): Cents {
  return addCents(...values);
}

export function subtractCents(minuend: Cents, subtrahend: Cents): Cents {
  return cents(minuend - subtrahend);
}

export function negateCents(value: Cents): Cents {
  return cents(-value);
}

export function absoluteCents(value: Cents): Cents {
  return cents(Math.abs(value));
}

/** Multiply by a plain factor, rounding to the nearest minor unit. */
export function scaleCents(value: Cents, factor: number): Cents {
  assertFinite(factor, 'factor');
  return cents(value * factor);
}

export function isZeroCents(value: Cents): boolean {
  return value === 0;
}

export function isNegativeCents(value: Cents): boolean {
  return value < 0;
}

export function compareCents(left: Cents, right: Cents): -1 | 0 | 1 {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

export function minCents(...values: readonly Cents[]): Cents {
  return cents(Math.min(...values));
}

export function maxCents(...values: readonly Cents[]): Cents {
  return cents(Math.max(...values));
}

/** `spent / limit` as a 0–1+ ratio, guarding against a zero limit. */
export function ratioOf(value: Cents, total: Cents): number {
  if (total === 0) return value === 0 ? 0 : 1;
  return value / total;
}

export const CurrencyCodes = ['USD', 'EUR', 'GBP', 'JPY', 'PHP', 'CAD', 'AUD', 'INR'] as const;
export const CurrencySchema = z.enum(CurrencyCodes);
export type CurrencyCode = z.infer<typeof CurrencySchema>;

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  PHP: '₱',
  CAD: 'CA$',
  AUD: 'A$',
  INR: '₹',
};

/** Currencies that are conventionally shown without minor units. */
const ZERO_DECIMAL_CURRENCIES: ReadonlySet<CurrencyCode> = new Set<CurrencyCode>(['JPY']);

export function currencySymbol(currency: CurrencyCode): string {
  return CURRENCY_SYMBOLS[currency];
}

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function compactWhole(whole: number): string {
  if (whole >= 1_000_000_000) return `${trimZero(whole / 1_000_000_000)}B`;
  if (whole >= 1_000_000) return `${trimZero(whole / 1_000_000)}M`;
  if (whole >= 10_000) return `${trimZero(whole / 1_000)}K`;
  return groupThousands(String(whole));
}

function trimZero(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '');
}

export interface FormatMoneyOptions {
  currency?: CurrencyCode;
  /** Always render a leading `+` for positive values. */
  showSign?: boolean;
  /** Abbreviate large values, for example `$1.2M`. */
  compact?: boolean;
  /** Wrap negative values in parentheses instead of using a `-` sign. */
  accounting?: boolean;
}

/**
 * Formats a `Cents` value without relying on `Intl`, which keeps the output
 * identical across platforms and trivial to unit test.
 */
export function formatMoney(value: Cents, options: FormatMoneyOptions = {}): string {
  const { currency = 'USD', showSign = false, compact = false, accounting = false } = options;
  const symbol = CURRENCY_SYMBOLS[currency];
  const hasMinorUnits = !ZERO_DECIMAL_CURRENCIES.has(currency);
  const negative = value < 0;
  const absolute = Math.abs(value);

  const whole = hasMinorUnits ? Math.floor(absolute / 100) : Math.round(absolute / 100);
  const fraction = absolute % 100;

  let body: string;
  if (compact && whole >= 10_000) {
    body = compactWhole(whole);
  } else if (hasMinorUnits) {
    body = `${groupThousands(String(whole))}.${String(fraction).padStart(2, '0')}`;
  } else {
    body = groupThousands(String(whole));
  }

  const prefix = negative ? (accounting ? '' : '-') : showSign ? '+' : '';
  const suffix = negative && accounting ? ')' : '';
  const opening = negative && accounting ? '(' : '';

  return `${opening}${prefix}${symbol}${body}${suffix}`;
}

/** Parses user input such as `"1,299.5"` into `Cents`, or `null` when invalid. */
export function parseAmountInput(input: string): Cents | null {
  const cleaned = input.trim().replace(/,/g, '');
  if (cleaned === '') return null;
  if (!/^-?\d*\.?\d*$/.test(cleaned)) return null;

  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return null;

  // Check the bounds *before* constructing a `Cents`, so an absurd input is
  // rejected rather than throwing out of a form validator.
  const rounded = Math.round(parsed * 100);
  if (!Number.isSafeInteger(rounded)) return null;
  if (Math.abs(rounded) > MAX_AMOUNT) return null;

  return cents(rounded);
}
