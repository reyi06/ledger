import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { getCategory } from '@/domain/categories';
import { subtractCents } from '@/domain/money';
import type { MonthKey } from '@/domain/primitives';
import { currentMonthKey } from '@/lib/date';
import { useMoney, useBudgetView } from '@/store/hooks';
import { useLedgerStore } from '@/store/ledger-store';
import { useTranslation } from '@/hooks/use-translation';
import { ThemedText } from '@/components/themed-text';
import { Reveal } from '@/components/motion';
import { AmountText } from '@/components/ui/amount-text';
import { EmptyState, ProgressBar } from '@/components/ui/feedback';
import { ListRow } from '@/components/ui/list-row';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { Card, Pill, SectionHeader } from '@/components/ui/surface';
import { MonthSwitcher } from '@/components/ui/month-switcher';
import { BudgetRow } from '@/components/budget-row';
import { BudgetEditor } from '@/components/budget-editor';

/**
 * Monthly envelopes.
 *
 * The summary used to state the same arithmetic four ways: the total limit as a
 * display figure, a bar, then `Spent`, `Left` and `Used` in a row — where `Left`
 * is the subtraction of the other two and `Used` is the bar. It is now two
 * numbers and a bar: what has been spent, against what was budgeted, and how far
 * along that is. The month moved out of the header, because the switcher already
 * says it.
 */
export default function BudgetsScreen() {
  const [month, setMonth] = useState<MonthKey>(currentMonthKey());
  const view = useBudgetView(month);
  const { format } = useMoney();
  const { t } = useTranslation();
  const removeBudget = useLedgerStore((state) => state.removeBudget);

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const openEditor = (categoryId: string | null) => {
    setEditingCategoryId(categoryId);
    setEditorOpen(true);
  };

  const overallRatio = view.totalLimit > 0 ? view.totalSpent / view.totalLimit : 0;
  const over = view.totalSpent > view.totalLimit;

  return (
    <>
      <Screen
        bottomInset={Spacing.four}
        header={
          <ScreenHeader
            title={t('tab.budgets')}
            right={
              view.overCount > 0 ? (
                <Pill label={t('budgets.overCount', { count: view.overCount })} tone="negative" />
              ) : undefined
            }
          />
        }>
        <Reveal>
          <MonthSwitcher month={month} onChange={setMonth} />
        </Reveal>

        <Reveal delay={80}>
          <Card>
            <SectionHeader title={t('common.thisMonth')} />

            <ThemedText type="hero">{format(view.totalSpent)}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.limit}>
              {t('budgets.budgetedOf', { amount: format(view.totalLimit) })}
            </ThemedText>

            <ProgressBar
              ratio={overallRatio}
              over={over}
              height={8}
              style={styles.bar}
            />

            {over ? (
              <ThemedText type="caption" themeColor="negative">
                {t('budgets.overBy', {
                  amount: format(subtractCents(view.totalSpent, view.totalLimit)),
                })}
              </ThemedText>
            ) : null}
          </Card>
        </Reveal>

        <Reveal delay={160}>
          <Card padded={false}>
            <View style={styles.listHeader}>
              <SectionHeader
                title={t('budgets.envelopes')}
                action={t('budgets.addBudget')}
                onAction={() => openEditor(null)}
                style={styles.noMargin}
              />
            </View>

            {view.statuses.length === 0 ? (
              <View style={styles.listBody}>
                <EmptyState
                  icon="speedometer-outline"
                  title={t('budgets.emptyTitle')}
                  body={t('budgets.emptyBody')}
                  actionLabel={t('budgets.emptyAction')}
                  onAction={() => openEditor(null)}
                />
              </View>
            ) : (
              <View style={styles.listBody}>
                {view.statuses.map((status, index) => (
                  <BudgetRow
                    key={status.budget.id}
                    status={status}
                    showDivider={index < view.statuses.length - 1}
                    onPress={() => openEditor(status.budget.categoryId)}
                  />
                ))}
              </View>
            )}
          </Card>
        </Reveal>

        {view.unbudgeted.length > 0 ? (
          <Reveal delay={240}>
            <Card padded={false}>
              <View style={styles.listHeader}>
                <SectionHeader
                  title={t('budgets.notBudgeted')}
                  action={t('common.add')}
                  onAction={() => openEditor(null)}
                  style={styles.noMargin}
                />
              </View>

              <View style={styles.listBody}>
                {view.unbudgeted.map((total, index) => (
                  <ListRow
                    key={total.categoryId}
                    showDivider={index < view.unbudgeted.length - 1}
                    title={getCategory(total.categoryId).label}
                    subtitle={t('budgets.noLimitSet')}
                    trailing={<AmountText value={total.total} />}
                    onPress={() => openEditor(total.categoryId)}
                  />
                ))}
              </View>
            </Card>
          </Reveal>
        ) : null}
      </Screen>

      <BudgetEditor
        visible={editorOpen}
        categoryId={editingCategoryId}
        month={month}
        onClose={() => setEditorOpen(false)}
        onRemove={(categoryId) => {
          removeBudget(categoryId);
          setEditorOpen(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  limit: {
    marginTop: Spacing.one,
  },
  bar: {
    marginTop: Spacing.three,
  },
  listHeader: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  listBody: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
  },
  noMargin: {
    marginBottom: 0,
  },
});
