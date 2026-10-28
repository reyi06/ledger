import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { getCategory } from '@/domain/categories';
import type { Cents } from '@/domain/money';
import type { MonthKey } from '@/domain/primitives';
import { currentMonthKey } from '@/lib/date';
import { formatPercent, formatSignedPercent, pluralize } from '@/lib/format';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { useInsightsView, useMoney } from '@/store/hooks';
import { ThemedText } from '@/components/themed-text';
import { Reveal } from '@/components/motion';
import { AmountText } from '@/components/ui/amount-text';
import { CategoryMark } from '@/components/ui/category-mark';
import { MiniBars } from '@/components/ui/data-viz';
import { EmptyState, ProgressBar } from '@/components/ui/feedback';
import { ListRow } from '@/components/ui/list-row';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { Sheet } from '@/components/ui/sheet';
import { Card, Pill, SectionHeader, SummaryRow } from '@/components/ui/surface';
import { MonthSwitcher } from '@/components/ui/month-switcher';

type SheetKind = 'compare' | 'pace' | 'trends' | 'merchants' | 'largest' | 'habits';

const SHEET_TITLE_KEYS: Record<SheetKind, string> = {
  compare: 'insights.comparedToLastMonth',
  pace: 'insights.spendingPace',
  trends: 'insights.categoryTrends',
  merchants: 'insights.topMerchants',
  largest: 'insights.biggestExpense',
  habits: 'insights.habits',
};

/**
 * Insights.
 *
 * This screen used to be the densest in the app: four stat tiles, a comparison
 * card, a pace chart, a category-trend table, a merchant table, a biggest-expense
 * card and a habits card, all at once. Eight blocks of numbers, and no way to tell
 * which one mattered.
 *
 * It is now a single headline — the savings rate, which is the only figure that
 * answers "how am I doing?" — and six one-line doors. Everything that was on the
 * screen is still reachable; it is just not all shouting at once. Nothing was
 * removed from the product, only from the viewport.
 */
export default function InsightsScreen() {
  const [month, setMonth] = useState<MonthKey>(currentMonthKey());
  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const { summary, cumulative } = useInsightsView(month);
  const { format } = useMoney();
  const theme = useTheme();
  const { t } = useTranslation();

  const isCurrentMonth = month === currentMonthKey();
  const spentShareOfIncome =
    summary.totals.income > 0 ? summary.totals.expense / summary.totals.income : 0;
  const largest = summary.largestExpense;
  const close = () => setSheet(null);

  return (
    <>
      <Screen
        bottomInset={Spacing.four}
        header={
          <ScreenHeader
            title={t('tab.insights')}
            subtitle={
              isCurrentMonth
                ? t('insights.daysOf', {
                    count: summary.daysElapsed,
                    total: summary.daysInMonth,
                  })
                : t('insights.selectedMonth')
            }
          />
        }>
        <Reveal>
          <MonthSwitcher month={month} onChange={setMonth} />
        </Reveal>

        {/*
          Nothing recorded means nothing to analyse. Leading with a confident "0%"
          would be a figure that means nothing, and six doors that all say "nothing"
          would read as a broken screen rather than an empty one.
        */}
        {summary.transactionCount === 0 ? (
          <Reveal delay={80}>
            <Card>
              <EmptyState
                icon="analytics-outline"
                title={t('insights.nothingToAnalyse')}
                body={t('insights.nothingToAnalyseBody')}
              />
            </Card>
          </Reveal>
        ) : (
          <>
            <Reveal delay={80}>
              <Card inverted>
                <ThemedText type="label" style={{ color: theme.onInverted, opacity: 0.6 }}>
                  {t('insights.savingsRate')}
                </ThemedText>
                <ThemedText type="hero" style={[styles.headline, { color: theme.onInverted }]}>
                  {formatPercent(Math.max(-9.99, summary.savingsRate))}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.onInverted, opacity: 0.75 }}>
                  {t('insights.spentAndIn', {
                    spent: format(summary.totals.expense),
                    in: format(summary.totals.income),
                  })}
                </ThemedText>
              </Card>
            </Reveal>

            {/*
              Two groups rather than six rows in a column. Six identical
              label-hint-chevron rows read as a settings list; grouping them into
              what is happening now and what the month is telling you gives the
              screen a shape to read.
            */}
            <Reveal delay={160}>
              <Card padded={false}>
                <View style={styles.listHeader}>
                  <SectionHeader title={t('insights.thisMonth')} style={styles.noMargin} />
                </View>

                <View style={styles.listBody}>
                  <SummaryRow
                    label={t('insights.comparedToLastMonth')}
                    hint={t('insights.comparedHint')}
                    value={formatSignedPercent(summary.expenseChange)}
                    onPress={() => setSheet('compare')}
                  />
                  <SummaryRow
                    label={t('insights.spendingPace')}
                    hint={
                      isCurrentMonth
                        ? t('insights.projectedHint', { amount: format(summary.projectedSpend) })
                        : t('insights.cumulativeHint')
                    }
                    onPress={() => setSheet('pace')}
                    showDivider={false}
                  />
                </View>
              </Card>
            </Reveal>

            <Reveal delay={240}>
              <Card padded={false}>
                <View style={styles.listHeader}>
                  <SectionHeader title={t('insights.patterns')} style={styles.noMargin} />
                </View>

                <View style={styles.listBody}>
                  <SummaryRow
                    label={t('insights.categoryTrends')}
                    hint={
                      summary.topCategories.length
                        ? t('insights.categoriesMoved', { count: summary.topCategories.length })
                        : t('insights.nothingMoved')
                    }
                    onPress={() => setSheet('trends')}
                  />
                  <SummaryRow
                    label={t('insights.topMerchants')}
                    hint={
                      summary.topMerchants.length
                        ? t('insights.merchants', { count: summary.topMerchants.length })
                        : t('insights.noMerchants')
                    }
                    onPress={() => setSheet('merchants')}
                  />
                  <SummaryRow
                    label={t('insights.biggestExpense')}
                    hint={
                      largest
                        ? largest.merchant?.trim() || getCategory(largest.categoryId).label
                        : t('insights.nothingRecorded')
                    }
                    value={largest ? format(largest.amount) : undefined}
                    onPress={() => setSheet('largest')}
                  />
                  <SummaryRow
                    label={t('insights.habits')}
                    hint={t('insights.activeDaysHint', {
                      count: summary.activeDays,
                      total: summary.daysElapsed,
                    })}
                    onPress={() => setSheet('habits')}
                    showDivider={false}
                  />
                </View>
              </Card>
            </Reveal>
          </>
        )}
      </Screen>

      <Sheet
        visible={sheet !== null}
        onClose={close}
        title={sheet ? t(SHEET_TITLE_KEYS[sheet]) : ''}
        subtitle={isCurrentMonth ? t('insights.thisMonth') : t('insights.selectedMonth')}>
        {sheet === 'compare' ? (
          <View style={styles.compareRow}>
            <CompareTile
              label="Spending"
              change={summary.expenseChange}
              current={summary.totals.expense}
              previous={summary.previousTotals.expense}
              invert
            />
            <CompareTile
              label="Income"
              change={summary.incomeChange}
              current={summary.totals.income}
              previous={summary.previousTotals.income}
            />
          </View>
        ) : null}

        {sheet === 'pace' ? (
          <View style={styles.pace}>
            <MiniBars
              values={cumulative.map((point) => point.total)}
              height={96}
              highlightIndex={Math.max(0, summary.daysElapsed - 1)}
            />
            <View style={styles.paceFooter}>
              <ThemedText type="caption" themeColor="textSecondary">
                {t('insights.cumulativeSpend', { days: cumulative.length })}
              </ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                {t('insights.ofIncome', {
                  percent: formatPercent(Math.min(9.99, spentShareOfIncome)),
                })}
              </ThemedText>
            </View>
          </View>
        ) : null}

        {sheet === 'trends' ? (
          summary.topCategories.length === 0 ? (
            <EmptyState
              icon="analytics-outline"
              title={t('insights.nothingToAnalyse')}
              body={t('insights.nothingToAnalyseBody')}
              compact
            />
          ) : (
            summary.topCategories.map((trend, index) => {
              const category = getCategory(trend.categoryId);
              return (
                <ListRow
                  key={trend.categoryId}
                  showDivider={index < summary.topCategories.length - 1}
                  leading={<CategoryMark categoryId={trend.categoryId} size={40} />}
                  title={category.label}
                  subtitle={`${format(trend.previous)} last month`}
                  trailing={
                    <View style={styles.trendTrailing}>
                      <AmountText value={trend.current} />
                      <ThemedText
                        type="caption"
                        style={{
                          color:
                            trend.change > 0.02
                              ? theme.negative
                              : trend.change < -0.02
                                ? theme.positive
                                : theme.textTertiary,
                        }}>
                        {trend.previous === 0 ? 'new' : formatSignedPercent(trend.change)}
                      </ThemedText>
                    </View>
                  }
                />
              );
            })
          )
        ) : null}

        {sheet === 'merchants' ? (
          summary.topMerchants.length === 0 ? (
            <EmptyState
              icon="storefront-outline"
              title={t('insights.noMerchants')}
              body={t('insights.noMerchantsBody')}
              compact
            />
          ) : (
            summary.topMerchants.map((merchant, index) => (
              <ListRow
                key={merchant.merchant}
                showDivider={index < summary.topMerchants.length - 1}
                leading={
                  <View style={[styles.rank, { backgroundColor: theme.tintMuted }]}>
                    <ThemedText type="caption" style={{ color: theme.sageText }}>
                      {index + 1}
                    </ThemedText>
                  </View>
                }
                title={merchant.merchant}
                subtitle={pluralize(merchant.count, 'visit', 'visits')}
                trailing={<AmountText value={merchant.total} />}
              />
            ))
          )
        ) : null}

        {sheet === 'largest' ? (
          largest ? (
            <View style={styles.largestRow}>
              <CategoryMark categoryId={largest.categoryId} size={48} />
              <View style={styles.largestText}>
                <ThemedText type="heading" numberOfLines={1}>
                  {largest.merchant?.trim() || getCategory(largest.categoryId).label}
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {getCategory(largest.categoryId).label}
                </ThemedText>
              </View>
              <AmountText value={largest.amount} type="amountLarge" />
            </View>
          ) : (
            <EmptyState
              icon="receipt-outline"
              title={t('insights.nothingRecorded')}
              body={t('insights.nothingToAnalyseBody')}
              compact
            />
          )
        ) : null}

        {sheet === 'habits' ? (
          <View style={styles.habitRow}>
            <HabitStat
              label={t('insights.activeDays')}
              value={`${summary.activeDays}/${summary.daysElapsed}`}
              ratio={summary.daysElapsed > 0 ? summary.activeDays / summary.daysElapsed : 0}
            />
            <HabitStat
              label={t('insights.budgetUsed')}
              value={formatPercent(Math.min(9.99, spentShareOfIncome))}
              ratio={Math.min(1, spentShareOfIncome)}
            />
          </View>
        ) : null}
      </Sheet>
    </>
  );
}

function CompareTile({
  label,
  change,
  current,
  previous,
  invert = false,
}: {
  label: string;
  change: number;
  current: Cents;
  previous: Cents;
  invert?: boolean;
}) {
  const theme = useTheme();
  const { format } = useMoney();

  // For spending, an increase is bad; for income, an increase is good.
  const positive = invert ? change <= 0 : change >= 0;
  const flat = Math.abs(change) < 0.02;

  return (
    <View style={[styles.compareTile, { backgroundColor: theme.surfaceAlt }]}>
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="subtitle">{format(current, { compact: true })}</ThemedText>
      <Pill
        label={`${change >= 0 ? '+' : ''}${(change * 100).toFixed(0)}%`}
        tone={flat ? 'neutral' : positive ? 'positive' : 'negative'}
      />
      <ThemedText type="caption" themeColor="textTertiary">
        was {format(previous, { compact: true })}
      </ThemedText>
    </View>
  );
}

function HabitStat({ label, value, ratio }: { label: string; value: string; ratio: number }) {
  return (
    <View style={styles.habit}>
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="heading">{value}</ThemedText>
      <ProgressBar ratio={ratio} height={8} />
    </View>
  );
}

const styles = StyleSheet.create({
  headline: {
    marginTop: Spacing.one,
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
  compareRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  compareTile: {
    flex: 1,
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    alignItems: 'flex-start',
  },
  pace: {
    gap: Spacing.two,
  },
  paceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trendTrailing: {
    alignItems: 'flex-end',
    gap: 1,
  },
  rank: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  largestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  largestText: {
    flex: 1,
    gap: 1,
  },
  habitRow: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
  habit: {
    flex: 1,
    gap: Spacing.one,
  },
});
