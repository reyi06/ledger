import { useMemo } from 'react';

import { formatMoney, sumCents, type Cents, type FormatMoneyOptions } from '@/domain/money';
import {
  accountBalance,
  activeAccounts,
  balancesByAccount,
  budgetStatuses,
  cashFlowSeries,
  filterTransactions,
  groupByDay,
  monthTotals,
  netWorth,
  periodTotals,
  sortByDateDesc,
  spendingByCategory,
  unbudgetedCategories,
  type TransactionFilter,
} from '@/domain/selectors';
import { buildInsights, cumulativeSpendSeries } from '@/domain/insights';
import { monthlyEquivalent, upcomingOccurrences } from '@/domain/recurring';
import type { Account } from '@/domain/models';
import type { MonthKey } from '@/domain/primitives';
import { addMonths, today } from '@/lib/date';
import { useLedgerStore } from './ledger-store';
import { useSettingsStore } from './settings-store';

/**
 * Read hooks.
 *
 * Raw slices come straight from the stores (stable references, so no
 * re-render storms). Anything derived is computed once per change with
 * `useMemo`, keeping screens free of arithmetic.
 */

export const useAccounts = () => useLedgerStore((state) => state.accounts);
export const useTransactions = () => useLedgerStore((state) => state.transactions);
export const useBudgets = () => useLedgerStore((state) => state.budgets);
export const useRecurringRules = () => useLedgerStore((state) => state.recurring);
export const useLedgerHydrated = () => useLedgerStore((state) => state.hydrated);
export const useLastMaterializedCount = () => useLedgerStore((state) => state.lastMaterializedCount);

export const useCurrency = () => useSettingsStore((state) => state.currency);
export const useSettingsHydrated = () => useSettingsStore((state) => state.hydrated);

/** Currency-aware money formatter that honours the "hide balances" preference. */
export function useMoney() {
  const currency = useCurrency();
  const hidden = useSettingsStore((state) => state.hideBalances);

  return useMemo(
    () => ({
      currency,
      hidden,
      format: (value: Cents, options: Omit<FormatMoneyOptions, 'currency'> = {}) =>
        hidden && value !== 0 ? '••••••' : formatMoney(value, { currency, ...options }),
    }),
    [currency, hidden],
  );
}

export function useOverview(month: MonthKey) {
  const accounts = useAccounts();
  const transactions = useTransactions();

  return useMemo(() => {
    const balances = balancesByAccount(accounts, transactions);
    const active = activeAccounts(accounts);

    return {
      accounts: active,
      balances,
      netWorth: netWorth(accounts, transactions),
      totals: monthTotals(transactions, month),
      previousTotals: monthTotals(transactions, addMonths(month, -1)),
      series: cashFlowSeries(transactions, month, 6),
      categories: spendingByCategory(transactions, month),
      recent: sortByDateDesc(transactions).slice(0, 6),
      accountBalanceOf: (account: Account) => balances.get(account.id) ?? account.openingBalance,
    };
  }, [accounts, transactions, month]);
}

export function useBudgetView(month: MonthKey) {
  const budgets = useBudgets();
  const transactions = useTransactions();

  return useMemo(() => {
    const statuses = budgetStatuses(budgets, transactions, month);
    return {
      statuses,
      unbudgeted: unbudgetedCategories(budgets, transactions, month),
      totalLimit: sumCents(statuses.map((status) => status.budget.limit)),
      totalSpent: sumCents(statuses.map((status) => status.spent)),
      overCount: statuses.filter((status) => status.isOver).length,
    };
  }, [budgets, transactions, month]);
}

export function useInsightsView(month: MonthKey) {
  const transactions = useTransactions();

  return useMemo(() => {
    const summary = buildInsights(transactions, month, today());
    // Only elapsed days: `cumulativeSpendSeries` covers the whole month, so
    // future days would repeat the last running total and render as a wall of
    // full-height bars implying spending that has not happened.
    const cumulative = cumulativeSpendSeries(transactions, month).slice(
      0,
      summary.daysElapsed,
    );
    return { summary, cumulative };
  }, [transactions, month]);
}

export function useActivityView(filter: TransactionFilter) {
  const transactions = useTransactions();
  const { query, month, direction, categoryId } = filter;

  return useMemo(() => {
    const filtered = sortByDateDesc(
      filterTransactions(transactions, { query, month, direction, categoryId }),
    );
    return {
      filtered,
      groups: groupByDay(filtered),
      totals: periodTotals(filtered),
      count: filtered.length,
    };
  }, [transactions, query, month, direction, categoryId]);
}

export function useRecurringView() {
  const rules = useRecurringRules();

  return useMemo(() => {
    const active = rules.filter((rule) => !rule.paused);
    const outflow = active
      .filter((rule) => rule.amount < 0)
      .reduce((total, rule) => total + Math.abs(monthlyEquivalent(rule)), 0);
    const inflow = active
      .filter((rule) => rule.amount > 0)
      .reduce((total, rule) => total + monthlyEquivalent(rule), 0);

    return {
      rules: [...rules].sort((left, right) => (left.startDate < right.startDate ? 1 : -1)),
      upcoming: upcomingOccurrences(rules, today(), 5),
      monthlyOutflow: Math.round(outflow) as Cents,
      monthlyInflow: Math.round(inflow) as Cents,
      pausedCount: rules.length - active.length,
    };
  }, [rules]);
}

export function useAccountBalance(accountId: string): Cents {
  const accounts = useAccounts();
  const transactions = useTransactions();

  return useMemo(() => {
    const account = accounts.find((candidate) => candidate.id === accountId);
    return account ? accountBalance(account, transactions) : (0 as Cents);
  }, [accounts, transactions, accountId]);
}

export function useTransaction(id: string | undefined) {
  const transactions = useTransactions();
  return useMemo(
    () => (id ? transactions.find((transaction) => transaction.id === id) : undefined),
    [transactions, id],
  );
}
