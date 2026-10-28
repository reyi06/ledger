import { addMonths, daysInMonth, firstWeekdayOfMonth, formatMonthLong, formatMonthShort, monthBounds, monthKeyOf, monthKeyOfParts, parseDateOnly, toDateOnly, today, addDays } from '@/lib/date';
import type { DateOnly, MonthKey } from '@/domain/primitives';

const day = (value: string) => value as DateOnly;
const month = (value: string) => value as MonthKey;

describe('date helpers', () => {
  it('round-trips date strings without timezone drift', () => {
    expect(parseDateOnly(day('2026-03-01')).getDate()).toBe(1);
    expect(parseDateOnly(day('2026-03-01')).getMonth()).toBe(2);
    expect(toDateOnly(new Date(2026, 2, 1))).toBe('2026-03-01');
  });

  it('derives month keys', () => {
    expect(monthKeyOf(day('2026-10-18'))).toBe('2026-10');
    expect(monthKeyOfParts(2026, 1)).toBe('2026-01');
    expect(monthKeyOfParts(2026, 12)).toBe('2026-12');
  });

  it('adds months across year boundaries', () => {
    expect(addMonths(month('2026-12'), 1)).toBe('2027-01');
    expect(addMonths(month('2026-01'), -1)).toBe('2025-12');
    expect(addMonths(month('2026-06'), -6)).toBe('2025-12');
  });

  it('knows month lengths including leap years', () => {
    expect(daysInMonth(month('2026-01'))).toBe(31);
    expect(daysInMonth(month('2026-02'))).toBe(28);
    expect(daysInMonth(month('2024-02'))).toBe(29);
    expect(daysInMonth(month('2026-04'))).toBe(30);
  });

  it('computes month bounds and the starting weekday', () => {
    expect(monthBounds(month('2026-02'))).toEqual({ start: '2026-02-01', end: '2026-02-28' });
    // 2026-02-01 is a Sunday.
    expect(firstWeekdayOfMonth(month('2026-02'))).toBe(0);
  });

  it('adds days across month boundaries', () => {
    expect(addDays(day('2026-02-28'), 1)).toBe('2026-03-01');
    expect(addDays(day('2026-01-01'), -1)).toBe('2025-12-31');
  });

  it('formats month labels', () => {
    expect(formatMonthLong(month('2026-10'))).toBe('October 2026');
    expect(formatMonthShort(month('2026-10'))).toBe('Oct');
  });

  it('returns today in local time', () => {
    const now = new Date();
    expect(today()).toBe(toDateOnly(now));
  });
});
