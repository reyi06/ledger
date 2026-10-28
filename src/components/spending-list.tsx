import { StyleSheet, View } from 'react-native';

import { getCategory } from '@/domain/categories';
import type { CategoryTotal } from '@/domain/selectors';
import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { PressableSurface } from '@/components/motion';
import { AmountText } from '@/components/ui/amount-text';
import { Divider } from '@/components/ui/surface';
import { ProgressBar } from '@/components/ui/feedback';

/**
 * Ranked spending breakdown.
 *
 * Share is drawn as a soft bar. It used to be stated three ways at once — a
 * two-digit category index, a percentage, and the bar — all describing the same
 * proportion. The bar is the fastest of the three to read, so it is the one that
 * stayed.
 */
export function SpendingList({
  totals,
  limit,
  onPressCategory,
  emptyLabel = 'No spending recorded for this month.',
}: {
  totals: readonly CategoryTotal[];
  limit?: number;
  onPressCategory?: (categoryId: string) => void;
  emptyLabel?: string;
}) {
  const visible = limit ? totals.slice(0, limit) : totals;

  if (visible.length === 0) {
    return (
      <ThemedText type="body" themeColor="textSecondary">
        {emptyLabel}
      </ThemedText>
    );
  }

  return (
    <View>
      {visible.map((total, index) => (
        <View key={total.categoryId}>
          <PressableSurface
            disabled={!onPressCategory}
            onPress={() => onPressCategory?.(total.categoryId)}
            style={styles.row}>
            <View style={styles.body}>
              <View style={styles.labelRow}>
                <ThemedText type="heading" numberOfLines={1} style={styles.label}>
                  {getCategory(total.categoryId).label}
                </ThemedText>
                <AmountText value={total.total} type="amount" />
              </View>
              <ProgressBar ratio={total.share} height={6} />
            </View>
          </PressableSurface>

          {index < visible.length - 1 ? <Divider /> : null}
        </View>
      ))}

      {limit && totals.length > limit ? (
        <ThemedText type="caption" themeColor="textTertiary" style={styles.more}>
          +{totals.length - limit} more categories
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: Spacing.three,
  },
  body: {
    gap: Spacing.two,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  label: {
    flex: 1,
  },
  more: {
    marginTop: Spacing.three,
  },
});
