import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

import type { Cents } from './money';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type CategoryKind = 'income' | 'expense' | 'transfer';

export interface CategoryDefinition {
  id: string;
  label: string;
  kind: CategoryKind;
  icon: IoniconName;
  /** Two-digit editorial index, derived from list order. See `categoryCode`. */
  code: string;
}

/**
 * Categories are a fixed, curated list.
 *
 * They carry no colour. In a monochrome system the 18 entries are told apart by
 * their two-digit index, their typographic label and their position in a sorted
 * list — the same way an index works in a printed catalogue. Keeping a palette
 * here would be dead data that invites a regression back to hue-coded meaning.
 */
const DEFINITIONS: readonly Omit<CategoryDefinition, 'code'>[] = [
  // Income
  { id: 'salary', label: 'Salary', kind: 'income', icon: 'briefcase' },
  { id: 'freelance', label: 'Freelance', kind: 'income', icon: 'laptop' },
  { id: 'interest', label: 'Interest', kind: 'income', icon: 'trending-up' },
  { id: 'gifts-received', label: 'Gifts', kind: 'income', icon: 'gift' },

  // Expense
  { id: 'groceries', label: 'Groceries', kind: 'expense', icon: 'cart' },
  { id: 'dining', label: 'Dining out', kind: 'expense', icon: 'restaurant' },
  { id: 'transport', label: 'Transport', kind: 'expense', icon: 'car' },
  { id: 'housing', label: 'Housing', kind: 'expense', icon: 'home' },
  { id: 'utilities', label: 'Utilities', kind: 'expense', icon: 'flash' },
  { id: 'health', label: 'Health', kind: 'expense', icon: 'medkit' },
  { id: 'shopping', label: 'Shopping', kind: 'expense', icon: 'bag-handle' },
  { id: 'entertainment', label: 'Entertainment', kind: 'expense', icon: 'film' },
  { id: 'travel', label: 'Travel', kind: 'expense', icon: 'airplane' },
  { id: 'subscriptions', label: 'Subscriptions', kind: 'expense', icon: 'repeat' },
  { id: 'education', label: 'Education', kind: 'expense', icon: 'school' },
  { id: 'other', label: 'Other', kind: 'expense', icon: 'ellipsis-horizontal' },

  // Transfers move money between the user's own accounts. They are recorded so
  // balances stay correct, but excluded from income/expense reporting.
  { id: 'transfer-out', label: 'Transfer out', kind: 'transfer', icon: 'arrow-up-circle' },
  { id: 'transfer-in', label: 'Transfer in', kind: 'transfer', icon: 'arrow-down-circle' },
];

function indexCode(index: number): string {
  return String(index + 1).padStart(2, '0');
}

export const CATEGORIES: readonly CategoryDefinition[] = DEFINITIONS.map((definition, index) => ({
  ...definition,
  code: indexCode(index),
}));

export const TRANSFER_OUT_CATEGORY_ID = 'transfer-out';
export const TRANSFER_IN_CATEGORY_ID = 'transfer-in';

const TRANSFER_CATEGORY_IDS: ReadonlySet<string> = new Set([
  TRANSFER_OUT_CATEGORY_ID,
  TRANSFER_IN_CATEGORY_ID,
]);

export function isTransferCategory(categoryId: string): boolean {
  return TRANSFER_CATEGORY_IDS.has(categoryId);
}

const FALLBACK: CategoryDefinition = {
  id: 'other',
  label: 'Uncategorized',
  kind: 'expense',
  icon: 'ellipsis-horizontal',
  code: '00',
};

export const CATEGORY_MAP: ReadonlyMap<string, CategoryDefinition> = new Map(
  CATEGORIES.map((category) => [category.id, category]),
);

export const INCOME_CATEGORIES = CATEGORIES.filter((category) => category.kind === 'income');
export const EXPENSE_CATEGORIES = CATEGORIES.filter((category) => category.kind === 'expense');
export const TRANSFER_CATEGORIES = CATEGORIES.filter((category) => category.kind === 'transfer');

export function getCategory(id: string): CategoryDefinition {
  return CATEGORY_MAP.get(id) ?? FALLBACK;
}

export function categoryLabel(id: string): string {
  return getCategory(id).label;
}

/** The two-digit index shown in `CategoryMark`. */
export function categoryCode(id: string): string {
  return getCategory(id).code;
}

export function categoriesForKind(kind: CategoryKind): readonly CategoryDefinition[] {
  return kind === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

/** The default category pre-selected when creating a transaction. */
export const DEFAULT_EXPENSE_CATEGORY_ID = 'groceries';
export const DEFAULT_INCOME_CATEGORY_ID = 'salary';

export type { Cents };
