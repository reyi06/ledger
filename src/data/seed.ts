import { cents, dollarsToCents, type Cents } from '@/domain/money';
import { occurrenceDates } from '@/domain/recurring';
import type {
  Account,
  Budget,
  Frequency,
  LedgerSnapshot,
  RecurringRule,
  Transaction,
} from '@/domain/models';
import type { DateOnly, MonthKey } from '@/domain/primitives';
import { createId, nowTimestamp } from '@/lib/id';
import {
  addMonths,
  currentMonthKey,
  daysInMonth,
  splitMonthKey,
  today as todayDate,
  toDateOnly,
} from '@/lib/date';

/**
 * Demo data.
 *
 * Everything is generated from a fixed PRNG seed, so "Reset demo data" always
 * produces the same ledger. Recurring rules are expanded with the real
 * materializer, which guarantees the seeded history and the rules agree and
 * nothing gets double-counted on first launch.
 */

const PRNG_SEED = 0x5eed_1234;
const MONTHS_BACK = 5;

function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function pick<T>(random: () => number, values: readonly T[]): T {
  return values[Math.floor(random() * values.length)] as T;
}

function dayInMonth(month: MonthKey, day: number): DateOnly {
  const { year, month: monthNumber } = splitMonthKey(month);
  const safeDay = Math.min(day, daysInMonth(month));
  return toDateOnly(new Date(year, monthNumber - 1, safeDay));
}

function monthsBack(count: number): MonthKey[] {
  const end = currentMonthKey();
  const months: MonthKey[] = [];
  for (let offset = count; offset >= 0; offset -= 1) {
    months.push(addMonths(end, -offset));
  }
  return months;
}

export const SEED_ACCOUNT_IDS = {
  everyday: 'acc-everyday',
  savings: 'acc-savings',
  card: 'acc-card',
} as const;

export function createSeedAccounts(): Account[] {
  const createdAt = nowTimestamp();
  return [
    {
      id: SEED_ACCOUNT_IDS.everyday,
      name: 'Everyday Checking',
      kind: 'checking',
      institution: 'Meridian Bank',
      openingBalance: dollarsToCents(1850),
      archived: false,
      createdAt,
    },
    {
      id: SEED_ACCOUNT_IDS.savings,
      name: 'High-Yield Savings',
      kind: 'savings',
      institution: 'Meridian Bank',
      openingBalance: dollarsToCents(14200),
      archived: false,
      createdAt,
    },
    {
      id: SEED_ACCOUNT_IDS.card,
      name: 'Travel Rewards',
      kind: 'credit',
      institution: 'Aurora Card',
      openingBalance: dollarsToCents(-245),
      archived: false,
      createdAt,
    },
  ];
}

export function createSeedBudgets(): Budget[] {
  const createdAt = nowTimestamp();
  const limits: [string, number][] = [
    ['groceries', 600],
    ['dining', 250],
    ['transport', 150],
    ['shopping', 300],
    ['entertainment', 150],
    ['subscriptions', 80],
    ['health', 60],
  ];

  return limits.map(([categoryId, dollars]) => ({
    id: `budget-${categoryId}`,
    categoryId,
    limit: dollarsToCents(dollars),
    createdAt,
  }));
}

interface RuleBlueprint {
  id: string;
  accountId: string;
  categoryId: string;
  amount: Cents;
  frequency: Frequency;
  startMonthOffset: number;
  day: number;
  merchant: string;
}

const RULE_BLUEPRINTS: readonly RuleBlueprint[] = [
  {
    id: 'rule-salary',
    accountId: SEED_ACCOUNT_IDS.everyday,
    categoryId: 'salary',
    amount: dollarsToCents(3200),
    frequency: 'monthly',
    startMonthOffset: -MONTHS_BACK,
    day: 1,
    merchant: 'Northwind Labs',
  },
  {
    id: 'rule-rent',
    accountId: SEED_ACCOUNT_IDS.everyday,
    categoryId: 'housing',
    amount: dollarsToCents(-1650),
    frequency: 'monthly',
    startMonthOffset: -MONTHS_BACK,
    day: 1,
    merchant: 'Maple Court Apartments',
  },
  {
    id: 'rule-gym',
    accountId: SEED_ACCOUNT_IDS.everyday,
    categoryId: 'health',
    amount: dollarsToCents(-45),
    frequency: 'monthly',
    startMonthOffset: -MONTHS_BACK,
    day: 3,
    merchant: 'Ironline Fitness',
  },
  {
    id: 'rule-internet',
    accountId: SEED_ACCOUNT_IDS.everyday,
    categoryId: 'utilities',
    amount: dollarsToCents(-70),
    frequency: 'monthly',
    startMonthOffset: -MONTHS_BACK,
    day: 5,
    merchant: 'Fiberlink',
  },
  {
    id: 'rule-streaming',
    accountId: SEED_ACCOUNT_IDS.card,
    categoryId: 'subscriptions',
    amount: dollarsToCents(-49.99),
    frequency: 'monthly',
    startMonthOffset: -MONTHS_BACK,
    day: 8,
    merchant: 'Streamly',
  },
  {
    id: 'rule-retainer',
    accountId: SEED_ACCOUNT_IDS.everyday,
    categoryId: 'freelance',
    amount: dollarsToCents(240),
    frequency: 'biweekly',
    startMonthOffset: -MONTHS_BACK,
    day: 10,
    merchant: 'Pixelforge Studio',
  },
];

export function createSeedRecurringRules(reference: DateOnly = todayDate()): RecurringRule[] {
  const createdAt = nowTimestamp();

  return RULE_BLUEPRINTS.map((blueprint) => {
    const startMonth = addMonths(currentMonthKey(), blueprint.startMonthOffset);
    const rule: RecurringRule = {
      id: blueprint.id,
      accountId: blueprint.accountId,
      categoryId: blueprint.categoryId,
      amount: blueprint.amount,
      frequency: blueprint.frequency,
      startDate: dayInMonth(startMonth, blueprint.day),
      merchant: blueprint.merchant,
      paused: false,
      createdAt,
    };

    // Mark the rule as already expanded through today so the seeded history and
    // the rule agree the moment the app starts.
    const dates = occurrenceDates(rule, rule.startDate, reference);
    const last = dates[dates.length - 1];
    return last ? { ...rule, lastMaterializedOn: last } : rule;
  });
}

const GROCERS = ['Greenfield Market', 'Corner Grocer', 'Basket & Co', 'Freshline'] as const;
const RESTAURANTS = ['Cafe Lumen', 'Noodle Bar', 'Taco Union', 'Olive & Vine', 'Morning Brew'] as const;
const TRANSPORT = ['City Transit', 'Rideshare', 'Fuel Stop', 'Parking Co'] as const;
const SHOPS = ['Northside Outfitters', 'Paper & Ink', 'Tech Depot', 'Home Goods Co'] as const;
const FUN = ['Cinema Nine', 'Vinyl Room', 'Arcade Hall', 'Book Nook'] as const;
const TRAVEL = ['Skyline Air', 'Harbor Hotel', 'Rail Europe'] as const;
const FREELANCE_CLIENTS = ['Bright Path Co', 'Harborview Media', 'Kestrel Labs'] as const;

export function createSeedTransactions(reference: DateOnly = todayDate()): Transaction[] {
  const random = createRandom(PRNG_SEED);
  const transactions: Transaction[] = [];

  const push = (
    date: DateOnly,
    accountId: string,
    categoryId: string,
    amount: Cents,
    merchant?: string,
    note?: string,
  ) => {
    if (date > reference) return;
    transactions.push({
      id: createId('txn'),
      accountId,
      categoryId,
      amount,
      date,
      merchant,
      note,
      createdAt: `${date}T12:00:00.000Z`,
    });
  };

  // Recurring history comes from the real rules so the two can never disagree.
  const rules = createSeedRecurringRules(reference);
  for (const rule of rules) {
    const dates = occurrenceDates(rule, rule.startDate, reference);
    for (const date of dates) {
      push(date, rule.accountId, rule.categoryId, rule.amount, rule.merchant);
    }
  }

  for (const month of monthsBack(MONTHS_BACK)) {
    const dayOfMonth = (day: number) => dayInMonth(month, day);

    // Savings interest.
    push(dayOfMonth(20), SEED_ACCOUNT_IDS.savings, 'interest', dollarsToCents(38), 'Meridian Bank');

    // Occasional one-off freelance work.
    for (let index = 0; index < randomInt(random, 0, 2); index += 1) {
      push(
        dayOfMonth(randomInt(random, 6, 26)),
        SEED_ACCOUNT_IDS.everyday,
        'freelance',
        cents(randomInt(random, 45000, 95000)),
        pick(random, FREELANCE_CLIENTS),
      );
    }

    // Groceries, roughly weekly.
    for (const day of [2, 9, 16, 23]) {
      push(
        dayOfMonth(day + randomInt(random, 0, 2)),
        random() > 0.35 ? SEED_ACCOUNT_IDS.everyday : SEED_ACCOUNT_IDS.card,
        'groceries',
        cents(-randomInt(random, 7500, 14500)),
        pick(random, GROCERS),
      );
    }

    for (let index = 0; index < randomInt(random, 3, 5); index += 1) {
      push(
        dayOfMonth(randomInt(random, 1, 28)),
        SEED_ACCOUNT_IDS.card,
        'dining',
        cents(-randomInt(random, 1800, 7800)),
        pick(random, RESTAURANTS),
      );
    }

    for (let index = 0; index < randomInt(random, 3, 4); index += 1) {
      push(
        dayOfMonth(randomInt(random, 1, 28)),
        SEED_ACCOUNT_IDS.card,
        'transport',
        cents(-randomInt(random, 1800, 9500)),
        pick(random, TRANSPORT),
      );
    }

    for (let index = 0; index < randomInt(random, 1, 2); index += 1) {
      push(
        dayOfMonth(randomInt(random, 1, 28)),
        SEED_ACCOUNT_IDS.card,
        'shopping',
        cents(-randomInt(random, 3500, 24000)),
        pick(random, SHOPS),
      );
    }

    for (let index = 0; index < randomInt(random, 1, 2); index += 1) {
      push(
        dayOfMonth(randomInt(random, 1, 28)),
        SEED_ACCOUNT_IDS.card,
        'entertainment',
        cents(-randomInt(random, 1200, 6500)),
        pick(random, FUN),
      );
    }

    if (random() > 0.6) {
      push(
        dayOfMonth(randomInt(random, 8, 24)),
        SEED_ACCOUNT_IDS.card,
        'travel',
        cents(-randomInt(random, 18000, 95000)),
        pick(random, TRAVEL),
      );
    }

    if (random() > 0.75) {
      push(
        dayOfMonth(randomInt(random, 1, 28)),
        SEED_ACCOUNT_IDS.everyday,
        'other',
        cents(-randomInt(random, 2000, 9000)),
        'Miscellaneous',
      );
    }
  }

  return transactions;
}

export function createSeedData(reference: DateOnly = todayDate()): LedgerSnapshot {
  return {
    accounts: createSeedAccounts(),
    transactions: createSeedTransactions(reference),
    budgets: createSeedBudgets(),
    recurring: createSeedRecurringRules(reference),
  };
}

export function createEmptySnapshot(): LedgerSnapshot {
  return { accounts: [], transactions: [], budgets: [], recurring: [] };
}
