import {
  absoluteCents,
  addCents,
  cents,
  isNegativeCents,
  ratioOf,
  subtractCents,
  ZERO,
  type Cents,
} from './money';
import { categoryLabel, isTransferCategory } from './categories';
import type { Account, Budget, Transaction, TransactionDirection } from './models';
import type { DateOnly, MonthKey } from './primitives';
import { monthKeyOf, recentMonths } from '@/lib/date';

/**
 * Derived state, expressed as pure functions over the snapshot.
 *
 * Nothing in this file imports React, which keeps the interesting arithmetic
 * directly unit-testable and lets the UI memoize it however it likes.
 */

export interface CategoryTotal {
  categoryId: string;
  total: Cents;
  share: number;
  count: number;
}

export interface CashFlowPoint {
  month: MonthKey;
  income: Cents;
  expense: Cents;
}

export interface BudgetStatus {
  budget: Budget;
  spent: Cents;
  remaining: Cents;
  ratio: number;
  isOver: boolean;
}

export interface DayGroup {
  date: DateOnly;
  transactions: Transaction[];
  total: Cents;
}

export interface PeriodTotals {
  income: Cents;
  expense: Cents;
  net: Cents;
}

export function sortByDateDesc(transactions: readonly Transaction[]): Transaction[] {
  return [...transactions].sort((left, right) => {
    if (left.date !== right.date) return left.date < right.date ? 1 : -1;
    if (left.createdAt !== right.createdAt) return left.createdAt < right.createdAt ? 1 : -1;
    return left.id < right.id ? 1 : -1;
  });
}

export function activeAccounts(accounts: readonly Account[]): Account[] {
  return accounts.filter((account) => !account.archived);
}

export function accountBalance(account: Account, transactions: readonly Transaction[]): Cents {
  let total = account.openingBalance;
  for (const transaction of transactions) {
    if (transaction.accountId === account.id) {
      total = addCents(total, transaction.amount);
    }
  }
  return total;
}

export function balancesByAccount(
  accounts: readonly Account[],
  transactions: readonly Transaction[],
): Map<string, Cents> {
  const balances = new Map<string, Cents>();
  for (const account of accounts) {
    balances.set(account.id, account.openingBalance);
  }
  for (const transaction of transactions) {
    const current = balances.get(transaction.accountId);
    if (current === undefined) continue;
    balances.set(transaction.accountId, addCents(current, transaction.amount));
  }
  return balances;
}

export function netWorth(accounts: readonly Account[], transactions: readonly Transaction[]): Cents {
  const balances = balancesByAccount(accounts, transactions);
  let total = ZERO;
  for (const account of activeAccounts(accounts)) {
    total = addCents(total, balances.get(account.id) ?? ZERO);
  }
  return total;
}

export function transactionsInMonth(
  transactions: readonly Transaction[],
  month: MonthKey,
): Transaction[] {
  return transactions.filter((transaction) => monthKeyOf(transaction.date) === month);
}

export function periodTotals(transactions: readonly Transaction[]): PeriodTotals {
  let income = ZERO;
  let expense = ZERO;

  for (const transaction of transactions) {
    if (isTransferCategory(transaction.categoryId)) continue;
    if (isNegativeCents(transaction.amount)) {
      expense = addCents(expense, absoluteCents(transaction.amount));
    } else {
      income = addCents(income, transaction.amount);
    }
  }

  return { income, expense, net: subtractCents(income, expense) };
}

export function monthTotals(
  transactions: readonly Transaction[],
  month: MonthKey,
): PeriodTotals {
  return periodTotals(transactionsInMonth(transactions, month));
}

export function directionOf(transaction: Transaction): TransactionDirection {
  return isNegativeCents(transaction.amount) ? 'expense' : 'income';
}

/** Spending per category for a month, largest first. */
export function spendingByCategory(
  transactions: readonly Transaction[],
  month: MonthKey,
): CategoryTotal[] {
  const totals = new Map<string, { total: Cents; count: number }>();
  let grandTotal = ZERO;

  for (const transaction of transactionsInMonth(transactions, month)) {
    if (!isNegativeCents(transaction.amount)) continue;
    if (isTransferCategory(transaction.categoryId)) continue;
    const magnitude = absoluteCents(transaction.amount);
    const existing = totals.get(transaction.categoryId);
    totals.set(transaction.categoryId, {
      total: addCents(existing?.total ?? ZERO, magnitude),
      count: (existing?.count ?? 0) + 1,
    });
    grandTotal = addCents(grandTotal, magnitude);
  }

  return [...totals.entries()]
    .map(([categoryId, entry]) => ({
      categoryId,
      total: entry.total,
      count: entry.count,
      share: ratioOf(entry.total, grandTotal),
    }))
    .sort((left, right) => right.total - left.total);
}

/** Income and expense totals for each of the last `count` months. */
export function cashFlowSeries(
  transactions: readonly Transaction[],
  endMonth: MonthKey,
  count = 6,
): CashFlowPoint[] {
  const months = recentMonths(endMonth, count);
  const byMonth = new Map<MonthKey, PeriodTotals>();

  for (const transaction of transactions) {
    if (isTransferCategory(transaction.categoryId)) continue;
    const key = monthKeyOf(transaction.date);
    if (!months.includes(key)) continue;
    const current = byMonth.get(key) ?? { income: ZERO, expense: ZERO, net: ZERO };
    const amount = transaction.amount;
    byMonth.set(
      key,
      isNegativeCents(amount)
        ? {
            ...current,
            expense: addCents(current.expense, absoluteCents(amount)),
            net: subtractCents(current.net, absoluteCents(amount)),
          }
        : {
            ...current,
            income: addCents(current.income, amount),
            net: addCents(current.net, amount),
          },
    );
  }

  return months.map((month) => {
    const totals = byMonth.get(month) ?? { income: ZERO, expense: ZERO, net: ZERO };
    return { month, income: totals.income, expense: totals.expense };
  });
}

/** Progress for every budget, plus the categories that still need one. */
export function budgetStatuses(
  budgets: readonly Budget[],
  transactions: readonly Transaction[],
  month: MonthKey,
): BudgetStatus[] {
  const spend = new Map<string, Cents>();
  for (const total of spendingByCategory(transactions, month)) {
    spend.set(total.categoryId, total.total);
  }

  return budgets
    .map((budget) => {
      const spent = spend.get(budget.categoryId) ?? ZERO;
      return {
        budget,
        spent,
        remaining: subtractCents(budget.limit, spent),
        ratio: ratioOf(spent, budget.limit),
        isOver: spent > budget.limit,
      };
    })
    .sort((left, right) => right.ratio - left.ratio);
}

export function unbudgetedCategories(
  budgets: readonly Budget[],
  transactions: readonly Transaction[],
  month: MonthKey,
): CategoryTotal[] {
  const budgeted = new Set(budgets.map((budget) => budget.categoryId));
  return spendingByCategory(transactions, month).filter(
    (total) => !budgeted.has(total.categoryId),
  );
}

export interface TransactionFilter {
  query?: string;
  month?: MonthKey | 'all';
  direction?: TransactionDirection | 'all';
  categoryId?: string | null;
}

export function filterTransactions(
  transactions: readonly Transaction[],
  filter: TransactionFilter = {},
): Transaction[] {
  const { query = '', month = 'all', direction = 'all', categoryId = null } = filter;
  const needle = query.trim().toLowerCase();

  return transactions.filter((transaction) => {
    if (month !== 'all' && monthKeyOf(transaction.date) !== month) return false;
    if (direction !== 'all' && directionOf(transaction) !== direction) return false;
    if (categoryId && transaction.categoryId !== categoryId) return false;
    if (needle.length === 0) return true;

    const haystack = [
      transaction.merchant ?? '',
      transaction.note ?? '',
      categoryLabel(transaction.categoryId),
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(needle);
  });
}

/** Groups transactions by calendar day, newest day first. */
export function groupByDay(transactions: readonly Transaction[]): DayGroup[] {
  const groups = new Map<DateOnly, Transaction[]>();

  for (const transaction of sortByDateDesc(transactions)) {
    const existing = groups.get(transaction.date);
    if (existing) {
      existing.push(transaction);
    } else {
      groups.set(transaction.date, [transaction]);
    }
  }

  return [...groups.entries()].map(([date, items]) => ({
    date,
    transactions: items,
    total: items.reduce<Cents>((total, item) => addCents(total, item.amount), ZERO),
  }));
}

export function averageMonthlySpend(
  transactions: readonly Transaction[],
  months: readonly MonthKey[],
): Cents {
  if (months.length === 0) return ZERO;
  let total = ZERO;
  for (const month of months) {
    total = addCents(total, monthTotals(transactions, month).expense);
  }
  return cents(total / months.length);
}

export function largestExpenseInMonth(
  transactions: readonly Transaction[],
  month: MonthKey,
): Transaction | undefined {
  return sortByDateDesc(transactionsInMonth(transactions, month))
    .filter((transaction) => isNegativeCents(transaction.amount))
    .sort((left, right) => left.amount - right.amount)[0];
}

export function countByCategory(
  transactions: readonly Transaction[],
  categoryId: string,
): number {
  return transactions.filter((transaction) => transaction.categoryId === categoryId).length;
}
