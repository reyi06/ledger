import { absoluteCents, addCents, cents, isNegativeCents, ratioOf, subtractCents, ZERO, type Cents } from './money';
import { isTransferCategory } from './categories';
import type { Transaction } from './models';
import type { DateOnly, MonthKey } from './primitives';
import { daysInMonth, monthKeyOf, parseDateOnly, splitMonthKey } from '@/lib/date';
import { monthTotals, periodTotals, transactionsInMonth } from './selectors';

/**
 * Higher-level analytics. Everything here is derived from the same pure
 * selector primitives, so the Insights screen never recomputes balances.
 */

export interface CategoryTrend {
  categoryId: string;
  current: Cents;
  previous: Cents;
  change: number;
}

export interface MerchantTotal {
  merchant: string;
  total: Cents;
  count: number;
}

export interface InsightsSummary {
  month: MonthKey;
  totals: { income: Cents; expense: Cents; net: Cents };
  previousTotals: { income: Cents; expense: Cents; net: Cents };
  expenseChange: number;
  incomeChange: number;
  /** Share of income left after expenses, clamped to a sane display range. */
  savingsRate: number;
  averageDailySpend: Cents;
  projectedSpend: Cents;
  daysElapsed: number;
  daysInMonth: number;
  activeDays: number;
  transactionCount: number;
  largestExpense: Transaction | null;
  topCategories: CategoryTrend[];
  topMerchants: MerchantTotal[];
  averageTransaction: Cents;
}

function daysElapsedIn(month: MonthKey, reference: DateOnly): number {
  const total = daysInMonth(month);
  if (monthKeyOf(reference) !== month) return total;
  return Math.min(parseDateOnly(reference).getDate(), total);
}

function previousMonthOf(month: MonthKey): MonthKey {
  const { year, month: monthNumber } = splitMonthKey(month);
  const previous = new Date(year, monthNumber - 2, 1);
  return `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, '0')}` as MonthKey;
}

function expenseByCategory(
  transactions: readonly Transaction[],
  month: MonthKey,
): Map<string, Cents> {
  const totals = new Map<string, Cents>();
  for (const transaction of transactionsInMonth(transactions, month)) {
    if (!isNegativeCents(transaction.amount)) continue;
    if (isTransferCategory(transaction.categoryId)) continue;
    totals.set(
      transaction.categoryId,
      addCents(totals.get(transaction.categoryId) ?? ZERO, absoluteCents(transaction.amount)),
    );
  }
  return totals;
}

export function buildInsights(
  transactions: readonly Transaction[],
  month: MonthKey,
  reference: DateOnly,
): InsightsSummary {
  const monthTransactions = transactionsInMonth(transactions, month);
  const totals = monthTotals(transactions, month);
  const previous = previousMonthOf(month);
  const previousTotals = monthTotals(transactions, previous);

  const daysElapsed = daysElapsedIn(month, reference);
  const totalDays = daysInMonth(month);

  const activeDays = new Set(monthTransactions.map((transaction) => transaction.date)).size;
  const spendTransactions = monthTransactions.filter(
    (transaction) => isNegativeCents(transaction.amount) && !isTransferCategory(transaction.categoryId),
  );

  const averageDailySpend = daysElapsed > 0 ? cents(totals.expense / daysElapsed) : ZERO;
  const projectedSpend = cents(averageDailySpend * totalDays);
  const averageTransaction =
    spendTransactions.length > 0 ? cents(totals.expense / spendTransactions.length) : ZERO;

  const currentByCategory = expenseByCategory(transactions, month);
  const previousByCategory = expenseByCategory(transactions, previous);
  const categoryIds = new Set([...currentByCategory.keys(), ...previousByCategory.keys()]);

  const topCategories = [...categoryIds]
    .map((categoryId) => {
      const current = currentByCategory.get(categoryId) ?? ZERO;
      const previousAmount = previousByCategory.get(categoryId) ?? ZERO;
      return {
        categoryId,
        current,
        previous: previousAmount,
        change: previousAmount === 0 ? (current === 0 ? 0 : 1) : ratioOf(current, previousAmount) - 1,
      };
    })
    .filter((trend) => trend.current > 0 || trend.previous > 0)
    .sort((left, right) => right.current - left.current)
    .slice(0, 6);

  const merchantTotals = new Map<string, { total: Cents; count: number }>();
  for (const transaction of spendTransactions) {
    const name = (transaction.merchant ?? '').trim();
    if (name.length === 0) continue;
    const existing = merchantTotals.get(name);
    merchantTotals.set(name, {
      total: addCents(existing?.total ?? ZERO, absoluteCents(transaction.amount)),
      count: (existing?.count ?? 0) + 1,
    });
  }

  const topMerchants: MerchantTotal[] = [...merchantTotals.entries()]
    .map(([merchant, entry]) => ({ merchant, total: entry.total, count: entry.count }))
    .sort((left, right) => right.total - left.total)
    .slice(0, 5);

  const largestExpense =
    spendTransactions.length === 0
      ? null
      : [...spendTransactions].sort((left, right) => left.amount - right.amount)[0];

  const savingsRate =
    totals.income > 0 ? ratioOf(subtractCents(totals.income, totals.expense), totals.income) : 0;

  return {
    month,
    totals,
    previousTotals,
    expenseChange:
      previousTotals.expense === 0
        ? totals.expense === 0
          ? 0
          : 1
        : ratioOf(totals.expense, previousTotals.expense) - 1,
    incomeChange:
      previousTotals.income === 0
        ? totals.income === 0
          ? 0
          : 1
        : ratioOf(totals.income, previousTotals.income) - 1,
    savingsRate: Number.isFinite(savingsRate) ? savingsRate : 0,
    averageDailySpend,
    projectedSpend,
    daysElapsed,
    daysInMonth: totalDays,
    activeDays,
    transactionCount: monthTransactions.length,
    largestExpense,
    topCategories,
    topMerchants,
    averageTransaction,
  };
}

/** Cumulative spend per day of the month, for the trend sparkline. */
export function cumulativeSpendSeries(
  transactions: readonly Transaction[],
  month: MonthKey,
): { day: number; total: Cents }[] {
  const totalDays = daysInMonth(month);
  const perDay = new Array<number>(totalDays + 1).fill(0);

  for (const transaction of transactionsInMonth(transactions, month)) {
    if (!isNegativeCents(transaction.amount)) continue;
    if (isTransferCategory(transaction.categoryId)) continue;
    const day = parseDateOnly(transaction.date).getDate();
    perDay[day] += Math.abs(transaction.amount);
  }

  const series: { day: number; total: Cents }[] = [];
  let running = 0;
  for (let day = 1; day <= totalDays; day += 1) {
    running += perDay[day];
    series.push({ day, total: cents(running) });
  }
  return series;
}

/** Total spend across an arbitrary set of transactions. */
export function totalSpend(transactions: readonly Transaction[]): Cents {
  return periodTotals(
    transactions.filter((transaction) => !isTransferCategory(transaction.categoryId)),
  ).expense;
}
