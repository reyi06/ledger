import { centsToDollars } from '@/domain/money';
import { categoryLabel } from '@/domain/categories';
import type { Account, Transaction } from '@/domain/models';

/**
 * CSV export. Kept as a pure string builder so it can be tested and so the
 * caller decides where the bytes end up (share sheet, clipboard, file).
 */

function escapeField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const HEADER = [
  'date',
  'account',
  'category',
  'merchant',
  'note',
  'amount',
  'direction',
] as const;

export function transactionsToCsv(
  transactions: readonly Transaction[],
  accounts: readonly Account[],
): string {
  const accountsById = new Map(accounts.map((account) => [account.id, account]));

  const rows = [...transactions]
    .sort((left, right) => (left.date < right.date ? -1 : left.date > right.date ? 1 : 0))
    .map((transaction) => {
      const account = accountsById.get(transaction.accountId);
      return [
        transaction.date,
        account?.name ?? 'Unknown account',
        categoryLabel(transaction.categoryId),
        transaction.merchant ?? '',
        transaction.note ?? '',
        centsToDollars(transaction.amount).toFixed(2),
        transaction.amount < 0 ? 'out' : 'in',
      ]
        .map(escapeField)
        .join(',');
    });

  return [HEADER.join(','), ...rows].join('\n');
}

export function exportFileName(date = new Date()): string {
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
  return `ledger-export-${stamp}.csv`;
}
