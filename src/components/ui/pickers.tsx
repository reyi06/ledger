import { StyleSheet, View } from 'react-native';

import { Line, Spacing } from '@/constants/theme';
import { categoriesForKind, type CategoryKind } from '@/domain/categories';
import { useHaptics } from '@/hooks/use-haptics';
import { useTheme } from '@/hooks/use-theme';
import type { Account } from '@/domain/models';
import type { Cents } from '@/domain/money';
import { ThemedText } from '@/components/themed-text';
import { PressableSurface } from '@/components/motion';
import { Divider } from '@/components/ui/surface';
import { useMoney } from '@/store/hooks';

/**
 * Category grid.
 *
 * Each tile carries its index and label; the selected tile inverts. No colour is
 * involved, so a glance at the grid reads as a table of contents.
 */
export function CategoryPicker({
  kind,
  value,
  onChange,
}: {
  kind: CategoryKind;
  value: string;
  onChange: (categoryId: string) => void;
}) {
  const theme = useTheme();
  const haptics = useHaptics();
  const categories = categoriesForKind(kind);

  return (
    <View style={styles.grid}>
      {categories.map((category) => {
        const selected = category.id === value;
        return (
          <PressableSurface
            key={category.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              haptics.select();
              onChange(category.id);
            }}
            style={[
              styles.tile,
              {
                borderColor: selected ? theme.inverted : theme.border,
                backgroundColor: selected ? theme.inverted : 'transparent',
              },
            ]}>
            <ThemedText
              type="caption"
              style={{ color: selected ? theme.onInverted : theme.textTertiary }}>
              {category.code}
            </ThemedText>
            <ThemedText
              type="small"
              numberOfLines={2}
              style={{ color: selected ? theme.onInverted : theme.text }}>
              {category.label}
            </ThemedText>
          </PressableSurface>
        );
      })}
    </View>
  );
}

/**
 * Account selector.
 *
 * A ruled list with square checkboxes and balances, so the balances form
 * a readable column.
 */
export function AccountPicker({
  accounts,
  balances,
  value,
  onChange,
}: {
  accounts: readonly Account[];
  balances: Map<string, Cents>;
  value: string;
  onChange: (accountId: string) => void;
}) {
  const theme = useTheme();
  const haptics = useHaptics();
  const { format } = useMoney();

  return (
    <View style={[styles.accountList, { borderColor: theme.border }]}>
      {accounts.map((account, index) => {
        const selected = account.id === value;
        return (
          <View key={account.id}>
            <PressableSurface
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => {
                haptics.select();
                onChange(account.id);
              }}
              style={styles.accountRow}>
              <View style={styles.accountText}>
                <ThemedText type="heading" numberOfLines={1}>
                  {account.name}
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
                  {account.institution ?? 'Personal'}
                </ThemedText>
              </View>

              <ThemedText type="amount" themeColor="textSecondary" numberOfLines={1}>
                {format(balances.get(account.id) ?? account.openingBalance)}
              </ThemedText>

              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: theme.border,
                    backgroundColor: selected ? theme.inverted : 'transparent',
                  },
                ]}
              />
            </PressableSurface>

            {index < accounts.length - 1 ? <Divider /> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  tile: {
    width: '31.5%',
    minHeight: 76,
    borderWidth: Line.thin,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    justifyContent: 'space-between',
    gap: Spacing.one,
  },
  accountList: {
    borderWidth: Line.thin,
    paddingHorizontal: Spacing.three,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    minHeight: 64,
  },
  accountText: {
    flex: 1,
    gap: Spacing.half,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: Line.thin,
  },
});
