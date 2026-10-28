import {
  answerQuery,
  type AssistantContext,
  type FormatCents,
} from '@/domain/assistant';
import { cents } from '@/domain/money';
import type { Budget, RecurringRule, Transaction } from '@/domain/models';
import type { DateOnly } from '@/domain/primitives';

/**
 * The assistant is a parser, so the thing worth testing is that a question in
 * English lands on the right intent, the right entity and the right range — and
 * that it refuses rather than guesses. These are the cases that would silently
 * rot if the vocabulary were edited carelessly.
 */

const TODAY = '2026-10-18' as DateOnly;

const format: FormatCents = (value) => `$${(value / 100).toFixed(2)}`;

let nextId = 0;
function entry(
  date: DateOnly,
  categoryId: string,
  amount: number,
  merchant?: string,
): Transaction {
  nextId += 1;
  return {
    id: `tx-${nextId}`,
    accountId: 'acc-checking',
    categoryId,
    amount: cents(amount),
    date,
    merchant,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

function budget(categoryId: string, limit: number): Budget {
  nextId += 1;
  return {
    id: `bud-${nextId}`,
    categoryId,
    limit: cents(limit) as unknown as Budget['limit'],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

function rule(categoryId: string, amount: number, frequency: RecurringRule['frequency']): RecurringRule {
  nextId += 1;
  return {
    id: `rec-${nextId}`,
    accountId: 'acc-checking',
    categoryId,
    amount: cents(amount),
    frequency,
    startDate: '2026-01-01' as DateOnly,
    paused: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

const transactions: Transaction[] = [
  // This month (October 2026) — dining 90.15, groceries 120, transport 45, income 2000.
  entry('2026-10-01' as DateOnly, 'salary', 200_000, 'Northwind Payroll'),
  entry('2026-10-03' as DateOnly, 'dining', -3_000, 'Cafe Lumen'),
  entry('2026-10-10' as DateOnly, 'dining', -6_015, 'Sushi Bar'),
  entry('2026-10-12' as DateOnly, 'groceries', -12_000, 'Fresh Market'),
  entry('2026-10-15' as DateOnly, 'transport', -4_500, 'Fuel Stop'),
  // A transfer is neither income nor spending and must never enter a total.
  entry('2026-10-16' as DateOnly, 'transfer-out', -50_000),

  // Last month (September 2026) — dining 40, groceries 80, income 2000.
  entry('2026-09-01' as DateOnly, 'salary', 200_000, 'Northwind Payroll'),
  entry('2026-09-08' as DateOnly, 'dining', -4_000, 'Cafe Lumen'),
  entry('2026-09-20' as DateOnly, 'groceries', -8_000, 'Fresh Market'),
];

const context: AssistantContext = {
  transactions,
  budgets: [budget('dining', 25_000), budget('groceries', 10_000)],
  recurring: [rule('subscriptions', -1_500, 'monthly'), rule('salary', 200_000, 'monthly')],
  accounts: [
    { id: 'acc-checking', name: 'Everyday Checking', balance: cents(100_000) },
    { id: 'acc-savings', name: 'High-Yield Savings', balance: cents(500_000) },
  ],
  today: TODAY,
};

const ask = (question: string) => answerQuery(question, context, format);

describe('the assistant understands the question', () => {
  it('totals spending for the month in progress by default', () => {
    const answer = ask('how much did I spend this month');
    expect(answer?.headline).toBe('$255.15');
    // The transfer is excluded, so 755.15 would be the failure.
    expect(answer?.intent).toBe('spend-total');
  });

  it('totals income', () => {
    expect(ask('how much did I earn this month')?.headline).toBe('$2000.00');
  });

  it('reports net worth across accounts', () => {
    const answer = ask('what is my net worth');
    expect(answer?.headline).toBe('$6000.00');
    expect(answer?.rows).toHaveLength(2);
  });

  it('reports a single account by name', () => {
    const answer = ask('how much is in my savings');
    expect(answer?.intent).toBe('account-balance');
    expect(answer?.headline).toBe('$5000.00');
  });

  it('filters by a category label', () => {
    expect(ask('how much did I spend on dining out this month')?.headline).toBe('$90.15');
  });

  it('maps an alias onto the right category', () => {
    expect(ask('how much did I spend on eating out last month')?.headline).toBe('$40.00');
    expect(ask('how much did I spend on eating out last month')?.scope).toBe('Dining out');
  });

  it('maps a shop word onto the right category', () => {
    expect(ask('how much did I spend at the supermarket this month')?.headline).toBe('$120.00');
  });

  it('maps a transport word onto the right category', () => {
    expect(ask('how much did I spend on fuel this month')?.headline).toBe('$45.00');
  });

  it('resolves last month', () => {
    expect(ask('what did I spend last month')?.headline).toBe('$120.00');
  });

  it('resolves a named month in the past', () => {
    expect(ask('how much did I spend in september')?.headline).toBe('$120.00');
  });

  it('ranks categories', () => {
    const answer = ask('where did most of my money go this month');
    expect(answer?.headline).toBe('Groceries');
    expect(answer?.intent).toBe('top-category');
  });

  it('finds the largest single expense', () => {
    const answer = ask('what was my biggest expense this month');
    expect(answer?.headline).toBe('$120.00');
    expect(answer?.detail).toContain('Fresh Market');
  });

  it('counts entries', () => {
    expect(ask('how many entries this month')?.headline).toBe('6');
  });

  it('reports budget status overall', () => {
    // Groceries is 120 against a 100 limit; dining is 90.15 against 250.
    expect(ask('am I over budget')?.headline).toBe('1 over budget');
  });

  it('reports one budget by category', () => {
    const answer = ask('how is my dining budget');
    expect(answer?.headline).toBe('$90.15 of $250.00');
    expect(answer?.detail).toContain('left');
  });

  it('works out a savings rate', () => {
    // 2000 in, 255.15 out, so 87% kept.
    expect(ask("what's my savings rate this month")?.headline).toBe('87%');
  });

  it('compares against the previous period', () => {
    // 255.15 this month against 120.00 last month.
    expect(ask('how does this month compare to last month')?.headline).toBe('+113%');
  });

  it('totals recurring commitments as a monthly figure', () => {
    const answer = ask('what are my subscriptions');
    expect(answer?.headline).toBe('$15.00');
    expect(answer?.detail).toContain('2 rules');
  });

  it('lists what it can be asked about', () => {
    // Twelve expense categories; income and transfer categories are not
    // something you record spending against.
    expect(ask('what categories are there')?.headline).toBe('12');
  });

  it('reports an average daily spend', () => {
    // 255.15 across 18 elapsed days.
    expect(ask('what is my average daily spend')?.headline).toBe('$14.18');
  });
});

describe('the assistant refuses rather than guesses', () => {
  it('returns nothing for a question outside its vocabulary', () => {
    expect(ask('what is the weather tomorrow')).toBeNull();
    expect(ask('tell me a joke')).toBeNull();
    expect(ask('')).toBeNull();
  });

  it('says so when there is nothing recorded', () => {
    const answer = ask('how much did I spend in march');
    expect(answer?.headline).toBe('Nothing recorded');
  });

  it('does not invent a budget that was never set', () => {
    expect(ask('how is my travel budget')?.headline).toBe('No budget set');
  });
});

describe('every answer explains what it read', () => {
  it('always carries a scope', () => {
    const questions = [
      'how much did I spend this month',
      'what is my net worth',
      'where did most of my money go',
      'what was my biggest expense',
      'am I over budget',
    ];

    for (const question of questions) {
      const answer = ask(question);
      expect(answer?.scope).toBeTruthy();
      // The period belongs in `detail`, not `scope` — stating it twice was the
      // redundancy this design removed.
      expect(answer?.scope).not.toContain('this month');
    }
  });
});
