import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Line, Spacing } from '@/constants/theme';
import type { Cents } from '@/domain/money';
import type { MonthKey } from '@/domain/primitives';
import { currentMonthKey, formatMonthShort } from '@/lib/date';
import { useHaptics } from '@/hooks/use-haptics';
import { useTheme } from '@/hooks/use-theme';
import { useSettingsStore } from '@/store/settings-store';
import { useMoney, useOverview } from '@/store/hooks';
import { useTranslation } from '@/hooks/use-translation';
import { ThemedText } from '@/components/themed-text';
import { AssistantSheet } from '@/components/assistant-sheet';
import { Reveal } from '@/components/motion';
import { SpendingList } from '@/components/spending-list';
import { TransactionRow } from '@/components/transaction-row';
import { BarChart } from '@/components/ui/data-viz';
import { Fab, IconButton } from '@/components/ui/controls';
import { EmptyState } from '@/components/ui/feedback';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { Card, SectionHeader, StatTile } from '@/components/ui/surface';
import { MonthSwitcher } from '@/components/ui/month-switcher';

/**
 * Overview — the pilot screen for the Botanical system.
 *
 * The brief asks for half the density of what came before, and for the same
 * number not to be stated twice. Both are structural here, not cosmetic:
 *
 *  - **Five blocks, not eight.** The net-worth plate absorbed the accounts
 *    strip, because a total and its components belong in one object.
 *  - **The month is stated once.** It used to appear in the header subtitle *and*
 *    the switcher; the switcher won.
 *  - **`Net` is gone.** It was `In` minus `Out`, and the plate above already
 *    states the month's movement. Two figures, not three.
 *  - **The chart is one series.** Income-versus-expense drew a legend that the
 *    section title already implied, and repeated this month's two figures from
 *    the card above. Spend alone shows the trend, and nothing twice.
 *  - **No category index marks.** The number, the bar and the amount all
 *    described one proportion; the bar survives.
 *
 * Sections fade up in sequence rather than appearing all at once, which is the
 * system's whole idea of motion: slow, and never a jump.
 */
export default function OverviewScreen() {
  const [month, setMonth] = useState<MonthKey>(currentMonthKey());
  const [assistantOpen, setAssistantOpen] = useState(false);
  const overview = useOverview(month);
  const { format } = useMoney();
  const theme = useTheme();
  const { t } = useTranslation();
  const haptics = useHaptics();
  const hideBalances = useSettingsStore((state) => state.hideBalances);
  const setHideBalances = useSettingsStore((state) => state.setHideBalances);

  const change = overview.totals.net;
  const isCurrentMonth = month === currentMonthKey();
  const recent = overview.recent.slice(0, 3);

  return (
    <>
      <Screen
        bottomInset={96}
        header={
          <ScreenHeader
            title={t('tab.overview')}
            right={
              <IconButton
                icon={hideBalances ? 'eye-off-outline' : 'eye-outline'}
                accessibilityLabel={
                  hideBalances ? t('common.showBalances') : t('common.hideBalances')
                }
                onPress={() => setHideBalances(!hideBalances)}
              />
            }
          />
        }>
        <Reveal>
          <MonthSwitcher month={month} onChange={setMonth} />
        </Reveal>

        <Reveal delay={80}>
          <Card inverted>
            <ThemedText type="label" style={{ color: theme.onInverted, opacity: 0.6 }}>
              {t('overview.netWorth')}
            </ThemedText>
            <ThemedText type="hero" style={[styles.heroFigure, { color: theme.onInverted }]}>
              {format(overview.netWorth)}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.onInverted, opacity: 0.75 }}>
              {`${change < 0 ? '−' : '+'}${format(Math.abs(change) as Cents)} ${
                isCurrentMonth ? t('overview.soFarThisMonth') : t('overview.thatMonth')
              }`}
            </ThemedText>

            <View
              style={[
                styles.heroDivider,
                { backgroundColor: theme.onInverted, height: Line.hairline },
              ]}
            />

            <View style={styles.accountList}>
              {overview.accounts.length === 0 ? (
                <ThemedText type="small" style={{ color: theme.onInverted, opacity: 0.75 }}>
                  {t('overview.noAccounts')}
                </ThemedText>
              ) : (
                overview.accounts.map((account) => (
                  <View key={account.id} style={styles.accountRow}>
                    <ThemedText
                      type="small"
                      numberOfLines={1}
                      style={[styles.accountName, { color: theme.onInverted }]}>
                      {account.name}
                    </ThemedText>
                    <ThemedText type="amount" style={{ color: theme.onInverted }}>
                      {format(overview.accountBalanceOf(account))}
                    </ThemedText>
                  </View>
                ))
              )}
            </View>
          </Card>
        </Reveal>

        <Reveal delay={160}>
          <Card>
            <SectionHeader title={t('common.thisMonth')} />
            <View style={styles.statRow}>
              <StatTile
                label={t('common.in')}
                value={format(overview.totals.income)}
                tone="positive"
              />
              <StatTile
                label={t('common.out')}
                value={format(overview.totals.expense)}
                tone="negative"
              />
            </View>
          </Card>
        </Reveal>

        <Reveal delay={240}>
          <Card>
            <SectionHeader
              title={t('overview.spending')}
              action={t('tab.insights')}
              onAction={() => router.push('/insights')}
            />
            {overview.series.every((point) => point.expense === 0) ? (
              <ThemedText type="body" themeColor="textSecondary">
                {t('overview.noSpending')}
              </ThemedText>
            ) : (
              <BarChart
                data={overview.series.map((point) => ({
                  label: formatMonthShort(point.month),
                  primary: point.expense,
                }))}
                height={110}
                formatValue={(value) => format(value as Cents, { compact: true })}
              />
            )}
          </Card>
        </Reveal>

        <Reveal delay={320}>
          <Card>
            <SectionHeader
              title={t('overview.whereItWent')}
              action={t('tab.budgets')}
              onAction={() => router.push('/budgets')}
            />
            <SpendingList totals={overview.categories} limit={4} />
          </Card>
        </Reveal>

        <Reveal delay={400}>
          <Card padded={false}>
            <View style={styles.listHeader}>
              <SectionHeader
                title={t('overview.recent')}
                action={t('common.seeAll')}
                onAction={() => router.push('/activity')}
              />
            </View>

            <View style={styles.listBody}>
              {recent.length === 0 ? (
                <EmptyState
                  icon="receipt-outline"
                  title={t('overview.emptyTitle')}
                  body={t('overview.emptyBody')}
                  actionLabel={t('common.addTransaction')}
                  onAction={() => router.push('/transaction/new')}
                />
              ) : (
                recent.map((transaction, index) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    accountName={
                      overview.accounts.find((account) => account.id === transaction.accountId)
                        ?.name
                    }
                    showDivider={index < recent.length - 1}
                    onPress={() => router.push(`/transaction/${transaction.id}`)}
                  />
                ))
              )}
            </View>
          </Card>
        </Reveal>
      </Screen>

      <Fab
        accessibilityLabel={t('common.addTransaction')}
        onPress={() => {
          haptics.press();
          router.push('/transaction/new');
        }}
      />

      {/* Sits above the primary action rather than beside it, so the + stays the
          one thing the corner is for. Paper rather than ink, so it reads second. */}
      <Fab
        icon="sparkles-outline"
        variant="secondary"
        offset={72}
        accessibilityLabel={t('assistant.title')}
        onPress={() => setAssistantOpen(true)}
      />

      <AssistantSheet visible={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  heroFigure: {
    marginTop: Spacing.one,
  },
  heroDivider: {
    marginVertical: Spacing.four,
    opacity: 0.25,
  },
  accountList: {
    gap: Spacing.three,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  accountName: {
    flex: 1,
    opacity: 0.8,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.five,
  },
  listHeader: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  listBody: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
  },
});
