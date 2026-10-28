import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { FREQUENCY_LABELS } from '@/domain/models';
import { formatRelativeDay } from '@/lib/date';
import { useHaptics } from '@/hooks/use-haptics';
import { useTranslation } from '@/hooks/use-translation';
import { subtractCents } from '@/domain/money';
import { useMoney, useRecurringView } from '@/store/hooks';
import { useLedgerStore } from '@/store/ledger-store';
import { ThemedText } from '@/components/themed-text';
import { Block } from '@/components/motion';
import { AmountText } from '@/components/ui/amount-text';
import { Button, IconButton } from '@/components/ui/controls';
import { ActionSheet, ConfirmSheet } from '@/components/ui/dialogs';
import { EmptyState } from '@/components/ui/feedback';
import { Screen } from '@/components/ui/screen';
import { Card, SectionHeader, StatTile } from '@/components/ui/surface';
import { RecurringRow } from '@/components/recurring-row';

/**
 * Recurring rules.
 *
 * Rules are expanded lazily on launch, so this screen is the source of truth
 * for what is scheduled next and what each rule costs per month.
 */
export default function RecurringScreen() {
  const haptics = useHaptics();
  const { t } = useTranslation();
  const view = useRecurringView();
  const { format } = useMoney();
  const setRecurringPaused = useLedgerStore((state) => state.setRecurringPaused);
  const deleteRecurring = useLedgerStore((state) => state.deleteRecurring);

  const nextByRule = new Map(view.upcoming.map((occurrence) => [occurrence.rule.id, occurrence.date]));

  const [menuRule, setMenuRule] = useState<{ id: string; label: string; paused: boolean } | null>(null);
  const [deleteRule, setDeleteRule] = useState<{ id: string } | null>(null);

  const openMenu = (ruleId: string, label: string, paused: boolean) => {
    haptics.press();
    setMenuRule({ id: ruleId, label, paused });
  };

  return (
    <Screen
      bottomInset={Spacing.four}
      header={
        <View style={styles.header}>
          <IconButton icon="chevron-back" accessibilityLabel={t('common.goBack')} onPress={() => router.back()} />
          <ThemedText type="heading" style={styles.headerTitle}>
            {t('recurring.title')}
          </ThemedText>
          <IconButton
            icon="add"
            accessibilityLabel={t('recurring.new')}
            onPress={() => router.push('/recurring/new')}
          />
        </View>
      }>
      <Card>
        <SectionHeader title={t('recurring.committed')} />
        <View style={styles.tileRow}>
          <StatTile label={t('transaction.expense')} value={format(view.monthlyOutflow)} />
          <StatTile label={t('transaction.income')} value={format(view.monthlyInflow)} />
          <StatTile
            label={t('recurring.net')}
            value={format(subtractCents(view.monthlyInflow, view.monthlyOutflow), { showSign: true })}
          />
        </View>
        <ThemedText type="caption" themeColor="textTertiary" style={styles.note}>
          {t('recurring.monthlyNote')}
        </ThemedText>
      </Card>

      {view.upcoming.length > 0 ? (
        <Card padded={false}>
          <View style={styles.cardHeader}>
            <SectionHeader title={t('recurring.comingUp')} style={styles.noMargin} />
          </View>
          <View style={styles.list}>
            {view.upcoming.map((occurrence, index) => (
              <Block key={occurrence.rule.id}>
                <View style={styles.upcomingRow}>
                  <View style={styles.upcomingText}>
                    <ThemedText type="heading" numberOfLines={1}>
                      {occurrence.rule.merchant?.trim() || t('recurring.fallbackTitle')}
                    </ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">
                      {formatRelativeDay(occurrence.date)} ·{' '}
                      {t(FREQUENCY_LABELS[occurrence.rule.frequency])}
                    </ThemedText>
                  </View>
                  <AmountText value={occurrence.rule.amount} showSign />
                </View>
              </Block>
            ))}
          </View>
        </Card>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title={t('recurring.allRules')} />
        {view.rules.length === 0 ? (
          <EmptyState
            icon="repeat-outline"
            title={t('recurring.emptyTitle')}
            body={t('recurring.emptyBody')}
            actionLabel={t('recurring.createRule')}
            onAction={() => router.push('/recurring/new')}
          />
        ) : (
          <Card padded={false}>
            <View style={styles.list}>
              {view.rules.map((rule, index) => (
                <RecurringRow
                  key={rule.id}
                  rule={rule}
                  nextDate={nextByRule.get(rule.id)}
                  showDivider={index < view.rules.length - 1}
                  onPress={() =>
                    openMenu(
                      rule.id,
                      rule.merchant?.trim() || t(FREQUENCY_LABELS[rule.frequency]),
                      rule.paused,
                    )
                  }
                  onLongPress={() =>
                    openMenu(
                      rule.id,
                      rule.merchant?.trim() || t(FREQUENCY_LABELS[rule.frequency]),
                      rule.paused,
                    )
                  }
                />
              ))}
            </View>
          </Card>
        )}
      </View>

      <Button
        title={t('recurring.new')}
        icon="add"
        variant="secondary"
        onPress={() => router.push('/recurring/new')}
      />

      <ActionSheet
        visible={menuRule !== null}
        onClose={() => setMenuRule(null)}
        title={menuRule ? menuRule.label : ''}
        subtitle={t('recurring.manageBody')}
        cancelLabel={t('common.cancel')}
        actions={
          menuRule
            ? [
                {
                  label: t('common.edit'),
                  onPress: () => router.push(`/recurring/new?id=${menuRule.id}`),
                },
                {
                  label: menuRule.paused ? t('recurring.resume') : t('recurring.pause'),
                  onPress: () => {
                    setRecurringPaused(menuRule.id, !menuRule.paused);
                    haptics.tap();
                  },
                },
                {
                  label: t('common.delete'),
                  destructive: true,
                  onPress: () => setDeleteRule(menuRule),
                },
              ]
            : []
        }
      />

      <ConfirmSheet
        visible={deleteRule !== null}
        onClose={() => setDeleteRule(null)}
        title={t('recurring.delete')}
        body={t('recurring.deleteConfirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={() => {
          if (!deleteRule) return;
          deleteRecurring(deleteRule.id);
          haptics.warning();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  tileRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  note: {
    marginTop: Spacing.two,
  },
  cardHeader: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  noMargin: {
    marginBottom: 0,
  },
  list: {
    paddingHorizontal: Spacing.three,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  upcomingText: {
    flex: 1,
    gap: 1,
  },
  section: {
    gap: Spacing.two,
  },
});
