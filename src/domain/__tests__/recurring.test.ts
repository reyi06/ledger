import { dollarsToCents, negateCents } from '@/domain/money';
import type { RecurringRule } from '@/domain/models';
import type { DateOnly } from '@/domain/primitives';
import {
  materializeRecurring,
  monthlyEquivalent,
  nextOccurrence,
  occurrenceDates,
  upcomingOccurrences,
} from '@/domain/recurring';

const day = (value: string) => value as DateOnly;

function makeRule(overrides: Partial<RecurringRule> = {}): RecurringRule {
  return {
    id: 'rule-1',
    accountId: 'acc-checking',
    categoryId: 'housing',
    amount: negateCents(dollarsToCents(1000)),
    frequency: 'monthly',
    startDate: day('2026-01-31'),
    paused: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('recurring rules', () => {
  it('steps forward by the configured frequency', () => {
    expect(nextOccurrence(makeRule({ frequency: 'daily' }), day('2026-01-01'))).toBe('2026-01-02');
    expect(nextOccurrence(makeRule({ frequency: 'weekly' }), day('2026-01-01'))).toBe('2026-01-08');
    expect(nextOccurrence(makeRule({ frequency: 'biweekly' }), day('2026-01-01'))).toBe('2026-01-15');
    expect(nextOccurrence(makeRule({ frequency: 'yearly' }), day('2026-01-31'))).toBe('2027-01-31');
  });

  it('clamps the anchor day so short months still fire', () => {
    // Starting on the 31st: February has no 31st, so it lands on the 28th.
    expect(nextOccurrence(makeRule(), day('2026-01-31'))).toBe('2026-02-28');
    // ...and then returns to the 31st the following month.
    expect(nextOccurrence(makeRule(), day('2026-02-28'))).toBe('2026-03-31');
    expect(nextOccurrence(makeRule(), day('2024-01-31'))).toBe('2024-02-29');
  });

  it('lists every occurrence inside a window, inclusive', () => {
    const dates = occurrenceDates(makeRule(), day('2026-01-01'), day('2026-04-30'));
    expect(dates).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']);
  });

  it('returns nothing when the window precedes the rule', () => {
    expect(occurrenceDates(makeRule(), day('2025-01-01'), day('2025-12-31'))).toEqual([]);
  });

  it('expands a rule into transactions and remembers how far it got', () => {
    const result = materializeRecurring([makeRule()], day('2026-04-30'));

    expect(result.createdCount).toBe(4);
    expect(result.transactions.map((transaction) => transaction.date)).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
      '2026-04-30',
    ]);
    expect(result.transactions.every((transaction) => transaction.amount < 0)).toBe(true);
    expect(result.rules[0]?.lastMaterializedOn).toBe('2026-04-30');
  });

  it('does not create duplicates on a second pass', () => {
    const first = materializeRecurring([makeRule()], day('2026-04-30'));
    const second = materializeRecurring(first.rules, day('2026-04-30'));
    expect(second.createdCount).toBe(0);
  });

  it('only creates the occurrences that are actually new', () => {
    const caughtUp = materializeRecurring([makeRule()], day('2026-02-28'));
    const later = materializeRecurring(caughtUp.rules, day('2026-04-30'));
    expect(later.transactions.map((transaction) => transaction.date)).toEqual([
      '2026-03-31',
      '2026-04-30',
    ]);
  });

  it('skips paused rules entirely', () => {
    const result = materializeRecurring([makeRule({ paused: true })], day('2026-04-30'));
    expect(result.createdCount).toBe(0);
    expect(result.rules[0]?.lastMaterializedOn).toBeUndefined();
  });

  it('stops at the rule end date', () => {
    const result = materializeRecurring(
      [makeRule({ endDate: day('2026-02-28') })],
      day('2026-06-30'),
    );
    expect(result.transactions.map((transaction) => transaction.date)).toEqual([
      '2026-01-31',
      '2026-02-28',
    ]);
  });

  it('reports the next occurrence strictly after today', () => {
    const upcoming = upcomingOccurrences([makeRule()], day('2026-04-30'));
    expect(upcoming).toHaveLength(1);
    expect(upcoming[0]?.date).toBe('2026-05-31');
  });

  it('ignores paused rules when listing what is coming up', () => {
    expect(upcomingOccurrences([makeRule({ paused: true })], day('2026-04-30'))).toEqual([]);
  });

  it('normalizes every frequency to a monthly figure', () => {
    expect(monthlyEquivalent(makeRule({ frequency: 'monthly', amount: negateCents(dollarsToCents(100)) })))
      .toBe(negateCents(dollarsToCents(100)));
    expect(monthlyEquivalent(makeRule({ frequency: 'yearly', amount: negateCents(dollarsToCents(1200)) })))
      .toBe(negateCents(dollarsToCents(100)));
    // -1000 cents/week * 52/12 months = -4333.33 -> -4333
    expect(
      Math.round(
        monthlyEquivalent(
          makeRule({ frequency: 'weekly', amount: negateCents(dollarsToCents(10)) }),
        ),
      ),
    ).toBe(-4333);
  });
});
