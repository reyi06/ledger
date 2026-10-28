import { TRANSFER_IN_CATEGORY_ID, TRANSFER_OUT_CATEGORY_ID } from '@/domain/categories';
import { dollarsToCents, negateCents, type Cents } from '@/domain/money';
import type { Account, Budget, Transaction } from '@/domain/models';
import type { DateOnly, MonthKey } from '@/domain/primitives';
import {
  accountBalance,
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
} from '@/domain/selectors';

const day = (value: string) => value as DateOnly;
const month = (value: string) => value as MonthKey;
const stamp = '2026-10-01T00:00:00.000Z';

let counter = 0;

function makeAccount(overrides: Partial<Account> = {}): Account {
  counter += 1;
  return {
    id: `acc-${counter}`,
    name: 'Checking',
    kind: 'checking',
    openingBalance: dollarsToCents(1000),
    archived: false,
    createdAt: stamp,
    ...overrides,
  };
}

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  counter += 1;
  return {
    id: `txn-${counter}`,
    accountId: 'acc-checking',
    categoryId: 'groceries',
    amount: negateCents(dollarsToCents(50)),
    date: day('2026-10-05'),
    createdAt: stamp,
    ...overrides,
  };
}

const expense = (dollars: number, overrides: Partial<Transaction> = {}) =>
  makeTransaction({ amount: negateCents(dollarsToCents(dollars)), ...overrides });

const income = (dollars: number, overrides: Partial<Transaction> = {}) =>
  makeTransaction({ amount: dollarsToCents(dollars), ...overrides });

describe('selectors', () => {
  const checking = makeAccount({ id: 'acc-checking', openingBalance: dollarsToCents(1000) });
  const card = makeAccount({
    id: 'acc-card',
    kind: 'credit',
    openingBalance: dollarsToCents(-200),
  });
  const archived = makeAccount({ id: 'acc-old', archived: true, openingBalance: dollarsToCents(500) });

  it('computes a balance from the opening balance plus that account’s transactions', () => {
    const transactions = [
      expense(50, { accountId: 'acc-checking' }),
      income(200, { accountId: 'acc-checking' }),
      expense(999, { accountId: 'acc-card' }),
    ];

    expect(accountBalance(checking, transactions)).toBe(dollarsToCents(1150));
    expect(accountBalance(card, transactions)).toBe(dollarsToCents(-1199));

    const balances = balancesByAccount([checking, card], transactions);
    expect(balances.get('acc-checking')).toBe(dollarsToCents(1150));
  });

  it('excludes archived accounts from net worth', () => {
    const transactions = [expense(50, { accountId: 'acc-checking' })];
    // 1000 - 50 + (-200) = 750; the archived 500 is ignored.
    expect(netWorth([checking, card, archived], transactions)).toBe(dollarsToCents(750));
  });

  it('splits totals into income and expense magnitudes', () => {
    const totals = periodTotals([income(300), expense(120), expense(80)]);
    expect(totals.income).toBe(dollarsToCents(300));
    expect(totals.expense).toBe(dollarsToCents(200));
    expect(totals.net).toBe(dollarsToCents(100));
  });

  it('keeps transfers out of income and expense reporting', () => {
    const transactions = [
      income(100),
      expense(40),
      makeTransaction({
        amount: negateCents(dollarsToCents(500)),
        categoryId: TRANSFER_OUT_CATEGORY_ID,
      }),
      makeTransaction({ amount: dollarsToCents(500), categoryId: TRANSFER_IN_CATEGORY_ID }),
    ];

    const totals = periodTotals(transactions);
    expect(totals.income).toBe(dollarsToCents(100));
    expect(totals.expense).toBe(dollarsToCents(40));

    const byCategory = spendingByCategory(transactions, month('2026-10'));
    expect(byCategory.map((entry) => entry.categoryId)).toEqual(['groceries']);
  });

  it('ranks spending by category with shares that add up', () => {
    const transactions = [
      expense(300, { categoryId: 'housing' }),
      expense(100, { categoryId: 'groceries' }),
      expense(100, { categoryId: 'dining' }),
      income(500, { categoryId: 'salary' }),
    ];

    const byCategory = spendingByCategory(transactions, month('2026-10'));

    expect(byCategory.map((entry) => entry.categoryId)).toEqual(['housing', 'groceries', 'dining']);
    expect(byCategory[0]?.total).toBe(dollarsToCents(300));
    expect(byCategory.reduce((sum, entry) => sum + entry.share, 0)).toBeCloseTo(1);
  });

  it('scopes totals to a single month', () => {
    const transactions = [
      expense(100, { date: day('2026-10-02') }),
      expense(50, { date: day('2026-09-30') }),
    ];

    expect(monthTotals(transactions, month('2026-10')).expense).toBe(dollarsToCents(100));
    expect(monthTotals(transactions, month('2026-09')).expense).toBe(dollarsToCents(50));
    expect(monthTotals(transactions, month('2026-08')).expense).toBe(0);
  });

  it('groups by day, newest first, with a running day total', () => {
    const transactions = [
      expense(10, { date: day('2026-10-05') }),
      expense(20, { date: day('2026-10-06') }),
      income(5, { date: day('2026-10-06') }),
    ];

    const groups = groupByDay(transactions);

    expect(groups.map((group) => group.date)).toEqual(['2026-10-06', '2026-10-05']);
    expect(groups[0]?.transactions).toHaveLength(2);
    expect(groups[0]?.total).toBe(negateCents(dollarsToCents(15)));
  });

  it('sorts newest first and breaks ties deterministically', () => {
    const older = expense(1, { date: day('2026-10-01'), id: 'a' });
    const newer = expense(1, { date: day('2026-10-02'), id: 'b' });
    expect(sortByDateDesc([older, newer]).map((t) => t.id)).toEqual(['b', 'a']);
  });

  it('reports budget progress and flags overspend', () => {
    const budgets: Budget[] = [
      { id: 'b1', categoryId: 'groceries', limit: dollarsToCents(400), createdAt: stamp },
      { id: 'b2', categoryId: 'dining', limit: dollarsToCents(100), createdAt: stamp },
    ];

    const transactions = [
      expense(100, { categoryId: 'groceries' }),
      expense(150, { categoryId: 'dining' }),
    ];

    const statuses = budgetStatuses(budgets, transactions, month('2026-10'));

    // Sorted by how close to the limit they are: dining (150%) before groceries (25%).
    expect(statuses.map((status) => status.budget.categoryId)).toEqual(['dining', 'groceries']);

    const dining = statuses[0];
    expect(dining?.isOver).toBe(true);
    expect(dining?.remaining).toBe(dollarsToCents(-50));
    expect(dining?.ratio).toBeCloseTo(1.5);

    const groceries = statuses[1];
    expect(groceries?.isOver).toBe(false);
    expect(groceries?.remaining).toBe(dollarsToCents(300));
  });

  it('lists spending categories that have no budget', () => {
    const budgets: Budget[] = [
      { id: 'b1', categoryId: 'groceries', limit: dollarsToCents(400), createdAt: stamp },
    ];
    const transactions = [
      expense(100, { categoryId: 'groceries' }),
      expense(80, { categoryId: 'transport' }),
    ];

    const unbudgeted = unbudgetedCategories(budgets, transactions, month('2026-10'));
    expect(unbudgeted.map((entry) => entry.categoryId)).toEqual(['transport']);
  });

  it('filters by search text across merchant, note and category label', () => {
    const transactions = [
      expense(10, { merchant: 'Greenfield Market' }),
      expense(20, { note: 'birthday gift' }),
      expense(30, { categoryId: 'transport' }),
    ];

    expect(filterTransactions(transactions, { query: 'greenfield' })).toHaveLength(1);
    expect(filterTransactions(transactions, { query: 'BIRTHDAY' })).toHaveLength(1);
    expect(filterTransactions(transactions, { query: 'transport' })).toHaveLength(1);
    expect(filterTransactions(transactions, { query: 'nothing' })).toHaveLength(0);
  });

  it('filters by direction and month', () => {
    const transactions = [
      income(500, { date: day('2026-10-01') }),
      expense(20, { date: day('2026-10-02') }),
      expense(20, { date: day('2026-09-02') }),
    ];

    expect(filterTransactions(transactions, { direction: 'income' })).toHaveLength(1);
    expect(filterTransactions(transactions, { direction: 'expense' })).toHaveLength(2);
    expect(filterTransactions(transactions, { month: month('2026-10') })).toHaveLength(2);
  });

  it('builds a cash flow series ending at the requested month', () => {
    const transactions = [
      income(100, { date: day('2026-10-01') }),
      expense(40, { date: day('2026-09-15') }),
      expense(999, { date: day('2020-01-01') }),
    ];

    const series = cashFlowSeries(transactions, month('2026-10'), 3);

    expect(series).toHaveLength(3);
    expect(series.map((point) => point.month)).toEqual(['2026-08', '2026-09', '2026-10']);
    expect(series[2]?.income).toBe(dollarsToCents(100));
    expect(series[1]?.expense).toBe(dollarsToCents(40));
    // The out-of-range month is not represented anywhere.
    expect(series[0]?.expense).toBe(0 as Cents);
  });
});
