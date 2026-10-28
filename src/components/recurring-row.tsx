import { categoryLabel } from '@/domain/categories';
import { FREQUENCY_LABELS, type RecurringRule } from '@/domain/models';
import type { DateOnly } from '@/domain/primitives';
import { formatRelativeDay } from '@/lib/date';
import { useTranslation } from '@/hooks/use-translation';
import { AmountText } from '@/components/ui/amount-text';
import { CategoryMark } from '@/components/ui/category-mark';
import { ListRow } from '@/components/ui/list-row';

/** A recurring rule with its next scheduled occurrence. */
export function RecurringRow({
  rule,
  nextDate,
  onPress,
  onLongPress,
  showDivider = true,
}: {
  rule: RecurringRule;
  nextDate?: DateOnly;
  onPress?: () => void;
  onLongPress?: () => void;
  showDivider?: boolean;
}) {
  const { t } = useTranslation();
  const title = rule.merchant?.trim() || categoryLabel(rule.categoryId);
  const schedule = t(FREQUENCY_LABELS[rule.frequency]).toUpperCase();
  const subtitle = nextDate ? `${schedule} · NEXT ${formatRelativeDay(nextDate).toUpperCase()}` : schedule;

  return (
    <ListRow
      showDivider={showDivider}
      leading={<CategoryMark categoryId={rule.categoryId} size={40} />}
      title={title}
      subtitle={rule.paused ? `${subtitle} · PAUSED` : subtitle}
      trailing={<AmountText value={rule.amount} showSign arrow />}
      onPress={onPress}
      onLongPress={onLongPress}
    />
  );
}
