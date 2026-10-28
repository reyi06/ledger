import { create } from 'zustand';

import { TRANSFER_IN_CATEGORY_ID, TRANSFER_OUT_CATEGORY_ID } from '@/domain/categories';
import { negateCents, type Cents } from '@/domain/money';
import { materializeRecurring } from '@/domain/recurring';
import type {
  Account,
  AccountInput,
  Budget,
  PersistedLedger,
  RecurringInput,
  RecurringRule,
  Transaction,
  TransactionInput,
  TransferInput,
} from '@/domain/models';
import { createEmptySnapshot, createSeedData } from '@/data/seed';
import { ledgerRepository, type LedgerRepository } from '@/data/repositories';
import { today } from '@/lib/date';
import { createId, nowTimestamp } from '@/lib/id';

/**
 * The single source of truth for financial data.
 *
 * Every mutation produces new arrays rather than editing in place, which keeps
 * `useMemo`-based selectors correct and lets the persistence layer detect
 * changes with a cheap reference comparison.
 */

export interface LedgerState {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  recurring: RecurringRule[];
  hydrated: boolean;
  /** How many transactions recurring rules generated on the last hydrate. */
  lastMaterializedCount: number;

  hydrate(repository?: LedgerRepository): Promise<void>;

  addTransaction(input: TransactionInput): Transaction;
  updateTransaction(id: string, input: TransactionInput): void;
  deleteTransaction(id: string): void;
  duplicateTransaction(id: string): Transaction | null;
  addTransfer(input: TransferInput): void;

  addAccount(input: AccountInput): Account;
  updateAccount(id: string, input: AccountInput): void;
  setAccountArchived(id: string, archived: boolean): void;
  deleteAccount(id: string): void;

  setBudget(categoryId: string, limit: Cents): void;
  removeBudget(categoryId: string): void;

  addRecurring(input: RecurringInput): RecurringRule;
  updateRecurring(id: string, input: RecurringInput): void;
  setRecurringPaused(id: string, paused: boolean): void;
  deleteRecurring(id: string): void;

  resetToDemoData(): void;
  clearAllData(): void;
}

function buildTransaction(input: TransactionInput): Transaction {
  return {
    id: createId('txn'),
    accountId: input.accountId,
    categoryId: input.categoryId,
    amount: input.amount,
    date: input.date,
    merchant: input.merchant?.trim() || undefined,
    note: input.note?.trim() || undefined,
    createdAt: nowTimestamp(),
  };
}

export const useLedgerStore = create<LedgerState>()((set, get) => ({
  ...createEmptySnapshot(),
  hydrated: false,
  lastMaterializedCount: 0,

  async hydrate(repository: LedgerRepository = ledgerRepository) {
    const stored = await repository.load();
    // A new device starts empty. It used to load a demo ledger so every screen
    // had something to show, which meant a first-run app claimed the user had
    // balances they had never entered. Demo data is now opt-in from Settings.
    const base: PersistedLedger = stored ?? createEmptySnapshot();

    // Recurring rules are expanded lazily on launch, which keeps the ledger
    // correct without needing a background task.
    const materialized = materializeRecurring(base.recurring, today());

    set({
      accounts: base.accounts,
      transactions:
        materialized.createdCount > 0
          ? [...materialized.transactions, ...base.transactions]
          : base.transactions,
      budgets: base.budgets,
      recurring: materialized.rules,
      hydrated: true,
      lastMaterializedCount: materialized.createdCount,
    });
  },

  addTransaction(input) {
    const transaction = buildTransaction(input);
    set((state) => ({ transactions: [transaction, ...state.transactions] }));
    return transaction;
  },

  updateTransaction(id, input) {
    set((state) => ({
      transactions: state.transactions.map((transaction) =>
        transaction.id === id
          ? {
              ...transaction,
              accountId: input.accountId,
              categoryId: input.categoryId,
              amount: input.amount,
              date: input.date,
              merchant: input.merchant?.trim() || undefined,
              note: input.note?.trim() || undefined,
            }
          : transaction,
      ),
    }));
  },

  deleteTransaction(id) {
    set((state) => ({
      transactions: state.transactions.filter((transaction) => transaction.id !== id),
    }));
  },

  duplicateTransaction(id) {
    const source = get().transactions.find((transaction) => transaction.id === id);
    if (!source) return null;

    const copy: Transaction = {
      ...source,
      id: createId('txn'),
      date: today(),
      createdAt: nowTimestamp(),
    };

    set((state) => ({ transactions: [copy, ...state.transactions] }));
    return copy;
  },

  addTransfer(input) {
    const outgoing: Transaction = {
      id: createId('txn'),
      accountId: input.fromAccountId,
      categoryId: TRANSFER_OUT_CATEGORY_ID,
      amount: negateCents(input.amount),
      date: input.date,
      merchant: 'Transfer',
      note: input.note?.trim() || undefined,
      createdAt: nowTimestamp(),
    };

    const incoming: Transaction = {
      ...outgoing,
      id: createId('txn'),
      accountId: input.toAccountId,
      categoryId: TRANSFER_IN_CATEGORY_ID,
      amount: input.amount,
    };

    set((state) => ({ transactions: [outgoing, incoming, ...state.transactions] }));
  },

  addAccount(input) {
    const account: Account = {
      id: createId('acc'),
      name: input.name.trim(),
      kind: input.kind,
      institution: input.institution?.trim() || undefined,
      openingBalance: input.openingBalance,
      archived: false,
      createdAt: nowTimestamp(),
    };

    set((state) => ({ accounts: [...state.accounts, account] }));
    return account;
  },

  updateAccount(id, input) {
    set((state) => ({
      accounts: state.accounts.map((account) =>
        account.id === id
          ? {
              ...account,
              name: input.name.trim(),
              kind: input.kind,
              institution: input.institution?.trim() || undefined,
              openingBalance: input.openingBalance,
            }
          : account,
      ),
    }));
  },

  setAccountArchived(id, archived) {
    set((state) => ({
      accounts: state.accounts.map((account) =>
        account.id === id ? { ...account, archived } : account,
      ),
    }));
  },

  deleteAccount(id) {
    set((state) => ({
      accounts: state.accounts.filter((account) => account.id !== id),
      transactions: state.transactions.filter((transaction) => transaction.accountId !== id),
    }));
  },

  setBudget(categoryId, limit) {
    set((state) => {
      const existing = state.budgets.find((budget) => budget.categoryId === categoryId);
      if (existing) {
        return {
          budgets: state.budgets.map((budget) =>
            budget.categoryId === categoryId ? { ...budget, limit } : budget,
          ),
        };
      }
      return {
        budgets: [
          ...state.budgets,
          { id: createId('budget'), categoryId, limit, createdAt: nowTimestamp() },
        ],
      };
    });
  },

  removeBudget(categoryId) {
    set((state) => ({
      budgets: state.budgets.filter((budget) => budget.categoryId !== categoryId),
    }));
  },

  addRecurring(input) {
    const rule: RecurringRule = {
      id: createId('rule'),
      accountId: input.accountId,
      categoryId: input.categoryId,
      amount: input.amount,
      frequency: input.frequency,
      startDate: input.startDate,
      merchant: input.merchant?.trim() || undefined,
      note: input.note?.trim() || undefined,
      paused: false,
      createdAt: nowTimestamp(),
    };

    // A rule that starts in the past should immediately produce its history.
    const materialized = materializeRecurring([rule], today());
    const saved = materialized.rules[0] ?? rule;

    set((state) => ({
      recurring: [saved, ...state.recurring],
      transactions:
        materialized.createdCount > 0
          ? [...materialized.transactions, ...state.transactions]
          : state.transactions,
    }));

    return saved;
  },

  updateRecurring(id, input) {
    set((state) => ({
      recurring: state.recurring.map((rule) =>
        rule.id === id
          ? {
              ...rule,
              accountId: input.accountId,
              categoryId: input.categoryId,
              amount: input.amount,
              frequency: input.frequency,
              startDate: input.startDate,
              merchant: input.merchant?.trim() || undefined,
              note: input.note?.trim() || undefined,
            }
          : rule,
      ),
    }));
  },

  setRecurringPaused(id, paused) {
    set((state) => ({
      recurring: state.recurring.map((rule) => (rule.id === id ? { ...rule, paused } : rule)),
    }));
  },

  deleteRecurring(id) {
    set((state) => ({ recurring: state.recurring.filter((rule) => rule.id !== id) }));
  },

  resetToDemoData() {
    set({ ...createSeedData(), hydrated: true, lastMaterializedCount: 0 });
  },

  clearAllData() {
    set({ ...createEmptySnapshot(), lastMaterializedCount: 0 });
  },
}));

/** The persistable slice of the store. */
export function snapshotOfLedger(state: LedgerState): PersistedLedger {
  return {
    accounts: state.accounts,
    transactions: state.transactions,
    budgets: state.budgets,
    recurring: state.recurring,
  };
}
