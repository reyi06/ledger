import type { DateOnly, MonthKey } from '@/domain/primitives';

/**
 * Calendar helpers built on local-time `Date` objects.
 *
 * Dates are stored as `YYYY-MM-DD` strings and only ever parsed with the
 * `new Date(year, monthIndex, day)` constructor, so a transaction never
 * drifts across a day boundary because of a timezone offset.
 */

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function toDateOnly(date: Date): DateOnly {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` as DateOnly;
}

export function toMonthKey(date: Date): MonthKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}` as MonthKey;
}

/** Parses `YYYY-MM-DD` into a local-time `Date` at midnight. */
export function parseDateOnly(value: DateOnly): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function today(): DateOnly {
  return toDateOnly(new Date());
}

export function currentMonthKey(): MonthKey {
  return toMonthKey(new Date());
}

export function monthKeyOf(value: DateOnly): MonthKey {
  return value.slice(0, 7) as MonthKey;
}

export function splitMonthKey(month: MonthKey): { year: number; month: number } {
  const [yearPart, monthPart] = month.split('-').map(Number);
  return { year: yearPart ?? 0, month: monthPart ?? 1 };
}

export function monthKeyOfParts(year: number, month: number): MonthKey {
  return `${year}-${pad(month)}` as MonthKey;
}

export function addMonths(month: MonthKey, delta: number): MonthKey {
  const { year, month: monthNumber } = splitMonthKey(month);
  const shifted = new Date(year, monthNumber - 1 + delta, 1);
  return toMonthKey(shifted);
}

export function addDays(value: DateOnly, delta: number): DateOnly {
  const date = parseDateOnly(value);
  date.setDate(date.getDate() + delta);
  return toDateOnly(date);
}

export function isSameMonth(left: MonthKey, right: MonthKey): boolean {
  return left === right;
}

export function isFutureMonth(month: MonthKey): boolean {
  return month > currentMonthKey();
}

/** `2026-10` -> `"October 2026"`. */
export function formatMonthLong(month: MonthKey): string {
  const { year, month: monthNumber } = splitMonthKey(month);
  return `${MONTH_NAMES[monthNumber - 1]} ${year}`;
}

/** `2026-10` -> `"Oct"`. */
export function formatMonthShort(month: MonthKey): string {
  const { month: monthNumber } = splitMonthKey(month);
  return MONTH_NAMES[monthNumber - 1].slice(0, 3);
}

/** `2026-10-04` -> `"Oct 4"`. */
export function formatDayShort(value: DateOnly): string {
  const date = parseDateOnly(value);
  return `${MONTH_NAMES[date.getMonth()].slice(0, 3)} ${date.getDate()}`;
}

/** `2026-10-04` -> `"Sunday, October 4"`. */
export function formatDayLong(value: DateOnly): string {
  const date = parseDateOnly(value);
  return `${DAY_NAMES[date.getDay()]}, ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

/** Friendly labels for the recent past, falling back to a short date. */
export function formatRelativeDay(value: DateOnly): string {
  const now = today();
  if (value === now) return 'Today';
  if (value === addDays(now, -1)) return 'Yesterday';
  if (value === addDays(now, 1)) return 'Tomorrow';
  return formatDayShort(value);
}

export function daysInMonth(month: MonthKey): number {
  const { year, month: monthNumber } = splitMonthKey(month);
  return new Date(year, monthNumber, 0).getDate();
}

/** First and last calendar day of a month, inclusive. */
export function monthBounds(month: MonthKey): { start: DateOnly; end: DateOnly } {
  const { year, month: monthNumber } = splitMonthKey(month);
  return {
    start: toDateOnly(new Date(year, monthNumber - 1, 1)),
    end: toDateOnly(new Date(year, monthNumber - 1, daysInMonth(month))),
  };
}

/** Weekday index (0 = Sunday) that the month starts on, for calendar grids. */
export function firstWeekdayOfMonth(month: MonthKey): number {
  const { year, month: monthNumber } = splitMonthKey(month);
  return new Date(year, monthNumber - 1, 1).getDay();
}

/** Ordered list of `count` months ending at `endMonth` (inclusive). */
export function recentMonths(endMonth: MonthKey, count: number): MonthKey[] {
  const months: MonthKey[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    months.push(addMonths(endMonth, -offset));
  }
  return months;
}

export { DAY_NAMES, MONTH_NAMES };
