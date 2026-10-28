import {
  CentsSchema,
  addCents,
  cents,
  centsToDollars,
  dollarsToCents,
  formatMoney,
  parseAmountInput,
  ratioOf,
  subtractCents,
  sumCents,
} from '@/domain/money';

describe('money', () => {
  it('converts decimal amounts to integer minor units', () => {
    expect(dollarsToCents(19.99)).toBe(1999);
    expect(dollarsToCents(0.1)).toBe(10);
    expect(dollarsToCents(-42.5)).toBe(-4250);
    expect(centsToDollars(dollarsToCents(19.99))).toBeCloseTo(19.99);
  });

  it('rounds to the nearest minor unit', () => {
    expect(cents(1.4)).toBe(1);
    expect(cents(1.6)).toBe(2);
    expect(cents(-1.6)).toBe(-2);
  });

  it('refuses non-integer values at the type boundary', () => {
    expect(() => CentsSchema.parse(1.5)).toThrow();
    expect(() => cents(Number.NaN)).toThrow(TypeError);
    expect(() => cents(Number.POSITIVE_INFINITY)).toThrow(TypeError);
  });

  it('adds and subtracts without floating point drift', () => {
    // 0.1 + 0.2 === 0.30000000000000004 in binary floating point.
    const total = addCents(dollarsToCents(0.1), dollarsToCents(0.2));
    expect(total).toBe(30);
    expect(formatMoney(total)).toBe('$0.30');

    expect(subtractCents(dollarsToCents(10), dollarsToCents(3.25))).toBe(675);
    expect(sumCents([dollarsToCents(1), dollarsToCents(2), dollarsToCents(3)])).toBe(600);
  });

  it('formats currency with grouping and a fixed scale', () => {
    expect(formatMoney(dollarsToCents(1234.5))).toBe('$1,234.50');
    expect(formatMoney(dollarsToCents(0))).toBe('$0.00');
    expect(formatMoney(dollarsToCents(-5))).toBe('-$5.00');
    expect(formatMoney(dollarsToCents(-5), { accounting: true })).toBe('($5.00)');
    expect(formatMoney(dollarsToCents(5), { showSign: true })).toBe('+$5.00');
  });

  it('honours the currency and drops minor units where appropriate', () => {
    expect(formatMoney(dollarsToCents(10), { currency: 'EUR' })).toBe('€10.00');
    expect(formatMoney(dollarsToCents(10), { currency: 'JPY' })).toBe('¥10');
  });

  it('abbreviates only genuinely large values', () => {
    expect(formatMoney(dollarsToCents(9999), { compact: true })).toBe('$9,999.00');
    expect(formatMoney(dollarsToCents(1_234_567), { compact: true })).toBe('$1.2M');
  });

  it('parses user input leniently but safely', () => {
    expect(parseAmountInput('1,299.50')).toBe(129950);
    expect(parseAmountInput('  12 ')).toBe(1200);
    expect(parseAmountInput('.5')).toBe(50);
    expect(parseAmountInput('')).toBeNull();
    expect(parseAmountInput('abc')).toBeNull();
    expect(parseAmountInput('1.2.3')).toBeNull();
    expect(parseAmountInput('999999999999999')).toBeNull();
    expect(parseAmountInput('1e400')).toBeNull();
  });

  it('computes ratios without dividing by zero', () => {
    expect(ratioOf(dollarsToCents(50), dollarsToCents(100))).toBe(0.5);
    expect(ratioOf(dollarsToCents(150), dollarsToCents(100))).toBe(1.5);
    expect(ratioOf(cents(0), cents(0))).toBe(0);
    expect(ratioOf(dollarsToCents(5), cents(0))).toBe(1);
  });
});
