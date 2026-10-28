import { z } from 'zod';

import { CentsSchema, MAX_AMOUNT, parseAmountInput, type Cents } from './money';
import { DateOnlySchema, IdSchema, TimestampSchema, type DateOnly } from './primitives';

/**
 * The domain model. Everything the app persists is described here, and every
 * read from storage is validated against these schemas before it reaches the
 * UI, so corrupt or stale data fails loudly at the boundary instead of
 * rendering as `NaN`.
 */

export const AccountKinds = ['checking', 'savings', 'credit', 'investment', 'cash'] as const;
export const AccountKindSchema = z.enum(AccountKinds);
export type AccountKind = z.infer<typeof AccountKindSchema>;

export const ACCOUNT_KIND_LABELS: Record<AccountKind, string> = {
  checking: 'accountKind.checking',
  savings: 'accountKind.savings',
  credit: 'accountKind.credit',
  investment: 'accountKind.investment',
  cash: 'accountKind.cash',
};

export const AccountSchema = z.object({
  id: IdSchema,
  name: z.string().trim().min(1).max(40),
  kind: AccountKindSchema,
  institution: z.string().trim().max(40).optional(),
  /** Balance before any recorded transaction. */
  openingBalance: CentsSchema,
  archived: z.boolean().default(false),
  createdAt: TimestampSchema,
});
export type Account = z.infer<typeof AccountSchema>;

/** Credit accounts carry a balance you owe rather than a balance you hold. */
export function isLiability(account: Account): boolean {
  return account.kind === 'credit';
}

export const TransactionSchema = z.object({
  id: IdSchema,
  accountId: IdSchema,
  categoryId: IdSchema,
  /** Signed: positive is money in, negative is money out. */
  amount: CentsSchema,
  date: DateOnlySchema,
  merchant: z.string().trim().max(60).optional(),
  note: z.string().trim().max(200).optional(),
  createdAt: TimestampSchema,
});
export type Transaction = z.infer<typeof TransactionSchema>;

/** A rolling monthly limit for one expense category. */
export const BudgetSchema = z.object({
  id: IdSchema,
  categoryId: IdSchema,
  limit: z.number().int().positive().brand<'Cents'>(),
  createdAt: TimestampSchema,
});
export type Budget = z.infer<typeof BudgetSchema>;

export const TransactionDirections = ['expense', 'income'] as const;
export const TransactionDirectionSchema = z.enum(TransactionDirections);
export type TransactionDirection = z.infer<typeof TransactionDirectionSchema>;

function isPositiveAmountInput(value: string): boolean {
  const parsed = parseAmountInput(value);
  return parsed !== null && parsed > 0 && parsed <= MAX_AMOUNT;
}

function isSignedAmountInput(value: string): boolean {
  const parsed = parseAmountInput(value);
  return parsed !== null && Math.abs(parsed) <= MAX_AMOUNT;
}

/**
 * Raw form values, kept as strings so the input components stay fully
 * controlled. `TransactionFormSchema` is the single source of truth for what a
 * valid entry looks like.
 */
export const TransactionFormSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, 'validation.amountRequired')
    .refine(isPositiveAmountInput, { message: 'validation.amountPositive' }),
  direction: TransactionDirectionSchema,
  categoryId: IdSchema,
  accountId: IdSchema,
  date: DateOnlySchema,
  merchant: z.string().trim().max(60, 'validation.max60'),
  note: z.string().trim().max(200, 'validation.max200'),
});
export type TransactionForm = z.infer<typeof TransactionFormSchema>;

export const AccountFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'validation.accountName')
    .max(40, 'validation.max40'),
  kind: AccountKindSchema,
  institution: z.string().trim().max(40, 'validation.max40'),
  openingBalance: z
    .string()
    .trim()
    .min(1, 'validation.openingBalance')
    .refine(isSignedAmountInput, { message: 'validation.amountInvalid' }),
});
export type AccountForm = z.infer<typeof AccountFormSchema>;

export const BudgetFormSchema = z.object({
  limit: z
    .string()
    .trim()
    .min(1, 'validation.limitRequired')
    .refine(isPositiveAmountInput, { message: 'validation.limitPositive' }),
});
export type BudgetForm = z.infer<typeof BudgetFormSchema>;

/** Normalized input accepted by store actions, already free of strings. */
export interface TransactionInput {
  accountId: string;
  categoryId: string;
  amount: Cents;
  date: TransactionForm['date'];
  merchant?: string;
  note?: string;
}

export interface AccountInput {
  name: string;
  kind: AccountKind;
  institution?: string;
  openingBalance: Cents;
}

export const Frequencies = ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'] as const;
export const FrequencySchema = z.enum(Frequencies);
export type Frequency = z.infer<typeof FrequencySchema>;

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: 'frequency.daily',
  weekly: 'frequency.weekly',
  biweekly: 'frequency.biweekly',
  monthly: 'frequency.monthly',
  yearly: 'frequency.yearly',
};

/**
 * A template that the app expands into real transactions. Rules are
 * materialized lazily on launch, which keeps the ledger correct without
 * needing a background task.
 */
export const RecurringRuleSchema = z.object({
  id: IdSchema,
  accountId: IdSchema,
  categoryId: IdSchema,
  /** Signed, exactly like a transaction. */
  amount: CentsSchema,
  frequency: FrequencySchema,
  startDate: DateOnlySchema,
  endDate: DateOnlySchema.optional(),
  merchant: z.string().trim().max(60).optional(),
  note: z.string().trim().max(200).optional(),
  paused: z.boolean().default(false),
  /** Last date already expanded into a transaction. */
  lastMaterializedOn: DateOnlySchema.optional(),
  createdAt: TimestampSchema,
});
export type RecurringRule = z.infer<typeof RecurringRuleSchema>;

export const RecurringFormSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, 'validation.amountRequired')
    .refine(isPositiveAmountInput, { message: 'validation.amountPositive' }),
  direction: TransactionDirectionSchema,
  categoryId: IdSchema,
  accountId: IdSchema,
  frequency: FrequencySchema,
  startDate: DateOnlySchema,
  merchant: z.string().trim().max(60, 'validation.max60'),
  note: z.string().trim().max(200, 'validation.max200'),
});
export type RecurringForm = z.infer<typeof RecurringFormSchema>;

export const TransferFormSchema = z
  .object({
    amount: z
      .string()
      .trim()
      .min(1, 'validation.amountRequired')
      .refine(isPositiveAmountInput, { message: 'validation.amountPositive' }),
    fromAccountId: IdSchema,
    toAccountId: IdSchema,
    date: DateOnlySchema,
    note: z.string().trim().max(200, 'validation.max200'),
  })
  .refine((values) => values.fromAccountId !== values.toAccountId, {
    message: 'transfer.sameAccount',
    path: ['toAccountId'],
  });
export type TransferForm = z.infer<typeof TransferFormSchema>;

export interface RecurringInput {
  accountId: string;
  categoryId: string;
  amount: Cents;
  frequency: Frequency;
  startDate: DateOnly;
  merchant?: string;
  note?: string;
}

export interface TransferInput {
  fromAccountId: string;
  toAccountId: string;
  /** Positive magnitude; the store applies the sign to each leg. */
  amount: Cents;
  date: DateOnly;
  note?: string;
}

/**
 * Declared last because it aggregates every entity above. Keeping the
 * aggregate at the bottom means a new entity only has to be added in one place.
 */
export const LedgerSnapshotSchema = z.object({
  accounts: z.array(AccountSchema),
  transactions: z.array(TransactionSchema),
  budgets: z.array(BudgetSchema),
  recurring: z.array(RecurringRuleSchema),
});
export type LedgerSnapshot = z.infer<typeof LedgerSnapshotSchema>;

/** The document written to device storage. */
export const PersistedLedgerSchema = LedgerSnapshotSchema;
export type PersistedLedger = LedgerSnapshot;
