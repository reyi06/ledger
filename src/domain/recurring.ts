import { addDays, daysInMonth, monthKeyOfParts, parseDateOnly, toDateOnly } from '@/lib/date';
import { createId, nowTimestamp } from '@/lib/id';
import type { DateOnly } from './primitives';
import type { RecurringRule, Transaction } from './models';

/**
 * Recurring rules are expanded on demand rather than by a background task.
 * `materializeRecurring` is a pure function: it takes the current rules and
 * returns the transactions that should exist plus the updated rules. That
 * makes the feature deterministic and easy to unit test.
 */

/** Safety valve so a rule with a very old start date cannot generate forever. */
const MAX_OCCURRENCES_PER_RULE = 400;

/** The occurrence immediately after `from`, honouring the rule's frequency. */
export function nextOccurrence(rule: RecurringRule, from: DateOnly): DateOnly | null {
  const day = parseDateOnly(from);

  switch (rule.frequency) {
    case 'daily':
      return toDateOnly(new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1));
    case 'weekly':
      return toDateOnly(new Date(day.getFullYear(), day.getMonth(), day.getDate() + 7));
    case 'biweekly':
      return toDateOnly(new Date(day.getFullYear(), day.getMonth(), day.getDate() + 14));
    case 'monthly':
    case 'yearly': {
      // Anchor to the day-of-month the rule started on, clamped so a rule that
      // begins on the 31st still fires in February.
      const anchorDay = parseDateOnly(rule.startDate).getDate();
      const monthsToAdd = rule.frequency === 'monthly' ? 1 : 12;
      const target = new Date(day.getFullYear(), day.getMonth() + monthsToAdd, 1);
      const targetYear = target.getFullYear();
      const targetMonthIndex = target.getMonth();
      const maxDay = daysInMonth(monthKeyOfParts(targetYear, targetMonthIndex + 1));
      return toDateOnly(new Date(targetYear, targetMonthIndex, Math.min(anchorDay, maxDay)));
    }
    default:
      return null;
  }
}

/** Every occurrence of `rule` inside `[from, through]`, inclusive. */
export function occurrenceDates(
  rule: RecurringRule,
  from: DateOnly,
  through: DateOnly,
): DateOnly[] {
  const dates: DateOnly[] = [];
  if (rule.startDate > through) return dates;

  let cursor = rule.startDate;
  let guard = 0;

  while (cursor <= through && guard < MAX_OCCURRENCES_PER_RULE) {
    guard += 1;
    if (cursor >= from) dates.push(cursor);

    const next = nextOccurrence(rule, cursor);
    if (!next) break;
    cursor = next;
  }

  return dates;
}

export interface MaterializeResult {
  transactions: Transaction[];
  rules: RecurringRule[];
  createdCount: number;
}

/**
 * Expands every active rule up to `today`, skipping dates that were already
 * materialized. Returns new arrays; nothing is mutated.
 */
export function materializeRecurring(
  rules: readonly RecurringRule[],
  today: DateOnly,
): MaterializeResult {
  const created: Transaction[] = [];
  const updated: RecurringRule[] = [];

  for (const rule of rules) {
    if (rule.paused) {
      updated.push(rule);
      continue;
    }

    const from = rule.lastMaterializedOn ? addDays(rule.lastMaterializedOn, 1) : rule.startDate;
    const horizon = rule.endDate && rule.endDate < today ? rule.endDate : today;
    const dates = occurrenceDates(rule, from, horizon);

    if (dates.length === 0) {
      updated.push(rule);
      continue;
    }

    for (const date of dates) {
      created.push({
        id: createId('txn'),
        accountId: rule.accountId,
        categoryId: rule.categoryId,
        amount: rule.amount,
        date,
        merchant: rule.merchant,
        note: rule.note,
        createdAt: nowTimestamp(),
      });
    }

    updated.push({ ...rule, lastMaterializedOn: dates[dates.length - 1] });
  }

  return { transactions: created, rules: updated, createdCount: created.length };
}

export interface UpcomingOccurrence {
  rule: RecurringRule;
  date: DateOnly;
}

/** The next occurrence for each active rule, soonest first. */
export function upcomingOccurrences(
  rules: readonly RecurringRule[],
  today: DateOnly,
  limit = 5,
): UpcomingOccurrence[] {
  const upcoming: UpcomingOccurrence[] = [];

  for (const rule of rules) {
    if (rule.paused) continue;

    const floor =
      rule.lastMaterializedOn && rule.lastMaterializedOn > today ? rule.lastMaterializedOn : today;

    let cursor = rule.startDate;
    let guard = 0;
    while (cursor <= floor && guard < MAX_OCCURRENCES_PER_RULE) {
      const next = nextOccurrence(rule, cursor);
      if (!next) break;
      cursor = next;
      guard += 1;
    }

    if (rule.endDate && cursor > rule.endDate) continue;
    upcoming.push({ rule, date: cursor });
  }

  return upcoming
    .sort((left, right) => (left.date < right.date ? -1 : left.date > right.date ? 1 : 0))
    .slice(0, limit);
}

/** Monthly-equivalent cost of a rule, used to summarize commitments. */
export function monthlyEquivalent(rule: RecurringRule): number {
  switch (rule.frequency) {
    case 'daily':
      return rule.amount * 30;
    case 'weekly':
      return rule.amount * (52 / 12);
    case 'biweekly':
      return rule.amount * (26 / 12);
    case 'yearly':
      return rule.amount / 12;
    case 'monthly':
    default:
      return rule.amount;
  }
}
