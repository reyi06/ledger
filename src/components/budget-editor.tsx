import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EXPENSE_CATEGORIES, getCategory } from '@/domain/categories';
import { BudgetFormSchema } from '@/domain/models';
import { currencySymbol, parseAmountInput, type Cents } from '@/domain/money';
import { spendingByCategory } from '@/domain/selectors';
import { Line, Spacing } from '@/constants/theme';
import { formatPercent } from '@/lib/format';
import type { MonthKey } from '@/domain/primitives';
import { useHaptics } from '@/hooks/use-haptics';
import { useTranslation } from '@/hooks/use-translation';
import { useBudgets, useMoney, useTransactions } from '@/store/hooks';
import { useLedgerStore } from '@/store/ledger-store';
import { useSettingsStore } from '@/store/settings-store';
import { ThemedText } from '@/components/themed-text';
import { AmountField } from '@/components/ui/inputs';
import { CategoryPicker } from '@/components/ui/pickers';
import { ProgressBar } from '@/components/ui/feedback';
import { Button } from '@/components/ui/controls';
import { Sheet } from '@/components/ui/sheet';

/**
 * Create or edit a monthly envelope.
 *
 * Lives in a sheet rather than a route: it is a single value plus a category,
 * and keeping it inline means the budgets list never loses its scroll position.
 * The form is mounted only while the sheet is open, so opening it is the reset.
 */
export function BudgetEditor({
  visible,
  categoryId,
  month,
  onClose,
  onRemove,
}: {
  visible: boolean;
  /** `null` starts a new budget and shows the category picker. */
  categoryId: string | null;
  month: MonthKey;
  onClose: () => void;
  onRemove: (categoryId: string) => void;
}) {
  const budgets = useBudgets();
  const { t } = useTranslation();
  const existing = categoryId
    ? budgets.find((budget) => budget.categoryId === categoryId)
    : undefined;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={existing ? t('budgets.edit') : t('budgets.new')}
      subtitle={categoryId ? getCategory(categoryId).label : t('budgets.editorBody')}>
      {visible ? (
        <BudgetEditorForm
          initialCategoryId={categoryId}
          month={month}
          onClose={onClose}
          onRemove={onRemove}
        />
      ) : null}
    </Sheet>
  );
}

function BudgetEditorForm({
  initialCategoryId,
  month,
  onClose,
  onRemove,
}: {
  initialCategoryId: string | null;
  month: MonthKey;
  onClose: () => void;
  onRemove: (categoryId: string) => void;
}) {
  const haptics = useHaptics();
  const { t } = useTranslation();
  const budgets = useBudgets();
  const transactions = useTransactions();
  const { format } = useMoney();
  const currency = useSettingsStore((state) => state.currency);
  const setBudget = useLedgerStore((state) => state.setBudget);

  const [selected, setSelected] = useState<string | null>(initialCategoryId);
  const [amount, setAmount] = useState(() => {
    const existing = initialCategoryId
      ? budgets.find((budget) => budget.categoryId === initialCategoryId)
      : undefined;
    return existing ? (existing.limit / 100).toFixed(2) : '';
  });
  const [error, setError] = useState<string | null>(null);

  const existing = selected
    ? budgets.find((budget) => budget.categoryId === selected)
    : undefined;

  const spent: Cents =
    selected !== null
      ? (spendingByCategory(transactions, month).find(
          (total) => total.categoryId === selected,
        )?.total ?? (0 as Cents))
      : (0 as Cents);

  const parsedAmount = parseAmountInput(amount);
  const ratio = parsedAmount && parsedAmount > 0 ? spent / parsedAmount : 0;

  const budgetedIds = new Set(budgets.map((budget) => budget.categoryId));
  const available = EXPENSE_CATEGORIES.filter(
    (category) => !budgetedIds.has(category.id) || category.id === selected,
  );

  const save = () => {
    if (!selected) {
      setError(t('budgets.pickCategory'));
      haptics.warning();
      return;
    }

    const parsed = BudgetFormSchema.safeParse({ limit: amount });
    if (!parsed.success) {
      setError(t(parsed.error.issues[0]?.message ?? 'budgets.invalidLimit'));
      haptics.warning();
      return;
    }

    const value = parseAmountInput(parsed.data.limit);
    if (value === null || value <= 0) {
      setError(t('budgets.limitPositive'));
      haptics.warning();
      return;
    }

    setBudget(selected, value);
    haptics.success();
    onClose();
  };

  return (
    <View style={styles.body}>
      <AmountField
        value={amount}
        onChangeText={(value) => {
          setAmount(value);
          setError(null);
        }}
        symbol={currencySymbol(currency)}
        error={error}
        autoFocus
      />

      {selected ? (
        <View style={styles.block}>
          <View style={styles.row}>
            <ThemedText type="caption" themeColor="textSecondary">
              {t('budgets.spentThisMonth')}
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {format(spent)}
            </ThemedText>
          </View>
          <ProgressBar ratio={ratio} height={Line.medium} />
          {parsedAmount && parsedAmount > 0 ? (
            <ThemedText type="caption" themeColor="textTertiary">
              {t('budgets.limitUsed', { percent: formatPercent(ratio) })}
            </ThemedText>
          ) : null}
        </View>
      ) : null}

      {!existing ? (
        <View style={styles.block}>
          <ThemedText type="label" themeColor="textSecondary">
            {t('transaction.category')}
          </ThemedText>
          <CategoryPicker
            kind="expense"
            value={selected ?? ''}
            onChange={(id) => {
              setSelected(id);
              setError(null);
            }}
          />
          {available.length === 0 ? (
            <ThemedText type="caption" themeColor="textTertiary">
              {t('budgets.allBudgetsSet')}
            </ThemedText>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button title={existing ? t('budgets.saveLimit') : t('budgets.createBudget')} onPress={save} />
        {existing ? (
          <Button
            title={t('budgets.remove')}
            variant="destructive"
            onPress={() => {
              haptics.warning();
              onRemove(existing.categoryId);
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: Spacing.three,
  },
  block: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actions: {
    gap: Spacing.two,
  },
});
