import { categoryLabel } from '@/domain/categories';
import type { Transaction } from '@/domain/models';
import { formatRelativeDay } from '@/lib/date';
import { AmountText } from '@/components/ui/amount-text';
import { ListRow } from '@/components/ui/list-row';

/**
 * One ledger entry.
 *
 * Direction is stated twice — by the sign on the figure and by the arrow — so
 * the row reads correctly without relying on colour.
 *
 * There is no leading category mark: the index number, the merchant and the date
 * were three labels competing for one glance. The merchant carries the row, and
 * the category is named in full on the detail screen.
 */
export function TransactionRow({
  transaction,
  accountName,
  onPress,
  onLongPress,
  showDivider = true,
}: {
  transaction: Transaction;
  accountName?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  showDivider?: boolean;
}) {
  const title = transaction.merchant?.trim() || categoryLabel(transaction.categoryId);
  const subtitle = [formatRelativeDay(transaction.date), accountName].filter(Boolean).join(' · ');

  return (
    <ListRow
      showDivider={showDivider}
      title={title}
      subtitle={subtitle}
      trailing={<AmountText value={transaction.amount} showSign arrow />}
      onPress={onPress}
      onLongPress={onLongPress}
    />
  );
}
