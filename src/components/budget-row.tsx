import { StyleSheet, View } from 'react-native';

import { getCategory } from '@/domain/categories';
import { subtractCents } from '@/domain/money';
import type { BudgetStatus } from '@/domain/selectors';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { PressableSurface } from '@/components/motion';
import { ProgressBar } from '@/components/ui/feedback';
import { Divider } from '@/components/ui/surface';
import { useMoney } from '@/store/hooks';

/**
 * One budget envelope.
 *
 * A quiet row rather than a bordered box: envelopes form a table, and a stack of
 * cards would read as unrelated items.
 *
 * It used to state the same proportion four times — a category index, the
 * percentage in the header, the percentage again in the footer, and the bar. All
 * four described one ratio. What survives is the bar (fastest to read) and the two
 * numbers that are actually facts: what has been spent, and the limit it is
 * measured against. "Remaining" is gone because it is the subtraction of those
 * two, and the percentage is gone because the bar is the percentage.
 *
 * Over-budget is carried by the terracotta bar, a terracotta figure, and the
 * words "over by" — so it still reads on a grayscale screen.
 */
export function BudgetRow({
  status,
  onPress,
  showDivider = true,
}: {
  status: BudgetStatus;
  onPress?: () => void;
  showDivider?: boolean;
}) {
  const { format } = useMoney();
  const theme = useTheme();
  const category = getCategory(status.budget.categoryId);

  const overBy = subtractCents(status.spent, status.budget.limit);

  return (
    <View>
      <PressableSurface onPress={onPress} disabled={!onPress} style={styles.row}>
        <View style={styles.header}>
          <ThemedText type="heading" numberOfLines={1} style={styles.label}>
            {category.label}
          </ThemedText>

          <ThemedText
            type="amount"
            style={status.isOver ? { color: theme.terracottaText } : undefined}>
            {format(status.spent)}
          </ThemedText>
        </View>

        <ProgressBar ratio={status.ratio} over={status.isOver} />

        <ThemedText
          type="caption"
          themeColor="textTertiary"
          style={status.isOver ? { color: theme.terracottaText } : undefined}>
          {status.isOver ? `over by ${format(overBy)}` : `of ${format(status.budget.limit)}`}
        </ThemedText>
      </PressableSurface>

      {showDivider ? <Divider /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  label: {
    flex: 1,
  },
});
