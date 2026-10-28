import { router } from 'expo-router';
import { useMemo, useRef, useState, type ComponentRef } from 'react';
import { SectionList, StyleSheet, View, type GestureResponderEvent } from 'react-native';

import { Elevation, Radius, Spacing } from '@/constants/theme';
import { absoluteCents, sumCents } from '@/domain/money';
import type { Transaction, TransactionDirection } from '@/domain/models';
import type { MonthKey } from '@/domain/primitives';
import { addMonths, currentMonthKey, formatRelativeDay } from '@/lib/date';
import { useHaptics } from '@/hooks/use-haptics';
import { useScreenInsets } from '@/hooks/use-screen-insets';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { useAccounts, useActivityView, useMoney } from '@/store/hooks';
import { useLedgerStore } from '@/store/ledger-store';
import { ThemedText } from '@/components/themed-text';
import { Reveal } from '@/components/motion';
import { AmountText } from '@/components/ui/amount-text';
import { Button, Fab, Segmented } from '@/components/ui/controls';
import { ConfirmSheet } from '@/components/ui/dialogs';
import { EmptyState } from '@/components/ui/feedback';
import { TextField } from '@/components/ui/inputs';
import { ScreenHeader } from '@/components/ui/screen';
import { Sheet } from '@/components/ui/sheet';
import { Card, Chip, SectionHeader, StatTile, SummaryRow } from '@/components/ui/surface';
import { TransactionRow } from '@/components/transaction-row';

type Scope = 'current' | 'previous' | 'all';

const DIRECTIONS: readonly { value: TransactionDirection | 'all'; labelKey: string }[] = [
  { value: 'all', labelKey: 'common.all' },
  { value: 'expense', labelKey: 'common.spent' },
  { value: 'income', labelKey: 'common.earned' },
];

const SCOPES: readonly { value: Scope; labelKey: string }[] = [
  { value: 'current', labelKey: 'common.thisMonth' },
  { value: 'previous', labelKey: 'common.lastMonth' },
  { value: 'all', labelKey: 'common.allTime' },
];

/**
 * The ledger itself: search, filter, and the full history grouped by day.
 *
 * Selection is entered by **holding** a row, which is the gesture every list on
 * both platforms already uses for this. Once in, a tap toggles a row and dragging
 * across others adds them.
 *
 * Dragging is the reason this is a little unusual: React Native has no hit test,
 * so each row measures itself in window coordinates when selection begins, and the
 * pan gesture compares the finger's `pageY` against those bounds. Measuring at the
 * start of the gesture is what makes it accurate — rows are only measured while
 * the finger is down, so nothing goes stale as the list scrolls.
 *
 * The header used to carry five controls and three figures before the first
 * transaction appeared. Direction stays inline because it is one tap and changes
 * what you are reading; the period and the totals moved behind a single row that
 * opens them.
 */
export default function ActivityScreen() {
  const theme = useTheme();
  const insets = useScreenInsets();
  const haptics = useHaptics();
  const { format } = useMoney();
  const { t } = useTranslation();

  const [query, setQuery] = useState('');
  const [direction, setDirection] = useState<TransactionDirection | 'all'>('all');
  const [scope, setScope] = useState<Scope>('current');
  const [filterOpen, setFilterOpen] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());

  const rowNodes = useRef(new Map<string, ComponentRef<typeof View>>());
  const rowBounds = useRef(new Map<string, { top: number; bottom: number }>());

  const month: MonthKey | 'all' =
    scope === 'all'
      ? 'all'
      : scope === 'current'
        ? currentMonthKey()
        : addMonths(currentMonthKey(), -1);

  const view = useActivityView({ query, month, direction, categoryId: null });
  const accounts = useAccounts();
  const deleteTransaction = useLedgerStore((state) => state.deleteTransaction);

  const accountNames = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.name])),
    [accounts],
  );

  const sections = useMemo(
    () =>
      view.groups.map((group) => ({
        title: group.date,
        total: group.total,
        data: group.transactions,
      })),
    [view.groups],
  );

  const clearSelection = () => {
    setSelecting(false);
    setSelected(new Set());
  };

  /** Measures every mounted row so a drag can be hit-tested against real bounds. */
  const beginSelection = (transaction: Transaction) => {
    haptics.press();
    rowBounds.current.clear();

    rowNodes.current.forEach((node, id) => {
      node?.measureInWindow?.((_x, y, _width, height) => {
        rowBounds.current.set(id, { top: y, bottom: y + height });
      });
    });

    setSelected(new Set([transaction.id]));
    setSelecting(true);
  };

  const toggle = (id: string) => {
    haptics.select();
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /**
   * Drag across rows to add them.
   *
   * Adds rather than toggles: dragging back over a row you already have should
   * leave it selected, or a small wobble would undo the gesture.
   *
   * This uses the responder props directly rather than `PanResponder.create`,
   * because creating one during render is a ref access as far as the React
   * Compiler is concerned. Reading the maps inside the handler is not — the
   * handler runs at gesture time, not during render.
   */
  const handleResponderMove = (event: GestureResponderEvent) => {
    const { pageY } = event.nativeEvent;

    rowBounds.current.forEach((bounds, id) => {
      if (pageY < bounds.top || pageY > bounds.bottom) return;
      setSelected((current) => {
        if (current.has(id)) return current;
        const next = new Set(current);
        next.add(id);
        return next;
      });
    });
  };

  const scopeLabel = SCOPES.find((entry) => entry.value === scope)?.labelKey ?? 'common.thisMonth';

  return (
    <View
      style={[styles.root, { backgroundColor: theme.background }]}
      onMoveShouldSetResponder={() => selecting}
      onResponderMove={handleResponderMove}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        // Scrolling is off while selecting, so the ScrollView does not claim the
        // drag gesture before the pan responder above it can hit-test rows.
        scrollEnabled={!selecting}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.three,
            paddingBottom: insets.bottom + Spacing.six + Spacing.four,
            paddingHorizontal: Spacing.four,
          },
        ]}
        ListHeaderComponent={
          <Reveal style={styles.headerBlock}>
            <ScreenHeader
              title={t('tab.activity')}
              subtitle={
                selecting
                  ? t('activity.selected', { count: selected.size })
                  : t('activity.entries', { count: view.count })
              }
            />

            <TextField
              value={query}
              onChangeText={setQuery}
              placeholder={t('activity.searchPlaceholder')}
              icon="search"
              autoCorrect={false}
              clearButtonMode="while-editing"
              returnKeyType="search"
            />

            <Segmented
              value={direction}
              onChange={setDirection}
              options={DIRECTIONS.map((entry) => ({
                value: entry.value,
                label: t(entry.labelKey),
              }))}
            />

            <SummaryRow
              label={t('activity.periodAndTotals')}
              hint={t('activity.inOut', {
                in: format(view.totals.income),
                out: format(view.totals.expense),
              })}
              value={t(scopeLabel)}
              onPress={() => setFilterOpen(true)}
              showDivider={false}
            />
          </Reveal>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <ThemedText type="label" themeColor="textSecondary">
              {formatRelativeDay(section.title)}
            </ThemedText>
            <AmountText value={section.total} showSign type="caption" />
          </View>
        )}
        renderItem={({ item, index, section }) => {
          const isSelected = selected.has(item.id);

          return (
            <View
              ref={(node) => {
                if (node) rowNodes.current.set(item.id, node);
                else rowNodes.current.delete(item.id);
              }}
              style={isSelected ? { backgroundColor: theme.tintMuted } : undefined}>
              <TransactionRow
                transaction={item}
                accountName={accountNames.get(item.accountId)}
                showDivider={index < section.data.length - 1}
                onPress={() =>
                  selecting ? toggle(item.id) : router.push(`/transaction/${item.id}`)
                }
                onLongPress={() =>
                  selecting ? clearSelection() : beginSelection(item)
                }
              />
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <EmptyState
              icon="search-outline"
              title={query ? t('activity.noMatches') : t('activity.nothingHere')}
              body={query ? t('activity.noMatchesBody') : t('activity.nothingHereBody')}
              actionLabel={query ? undefined : t('common.addTransaction')}
              onAction={query ? undefined : () => router.push('/transaction/new')}
            />
          </View>
        }
      />

      {selecting ? (
        <View
          style={[
            styles.selectionBar,
            Elevation.lg,
            {
              bottom: insets.bottom + Spacing.three,
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}>
          <ThemedText type="label" themeColor="textSecondary" style={styles.selectionCount}>
            {t('activity.selected', { count: selected.size })}
          </ThemedText>

          <View style={styles.selectionActions}>
            <Button
              title={t('common.delete')}
              variant="destructive"
              fullWidth={false}
              disabled={selected.size === 0}
              onPress={() => setConfirmBulkDelete(true)}
              style={styles.selectionButton}
            />
            <Button
              title={t('common.cancel')}
              variant="ghost"
              fullWidth={false}
              onPress={clearSelection}
              style={styles.selectionButton}
            />
          </View>
        </View>
      ) : (
        <Fab
          accessibilityLabel={t('common.addTransaction')}
          onPress={() => router.push('/transaction/new')}
        />
      )}

      <Sheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        title={t('activity.periodAndTotals')}
        subtitle={t('activity.entries', { count: view.count })}>
        <View style={styles.sheetBody}>
          <View style={styles.chipRow}>
            {SCOPES.map((entry) => (
              <Chip
                key={entry.value}
                label={t(entry.labelKey)}
                selected={scope === entry.value}
                onPress={() => setScope(entry.value)}
              />
            ))}
          </View>

          <Card padded={false}>
            <View style={styles.sheetCard}>
              <SectionHeader title={t('common.totals')} style={styles.noMargin} />
              <View style={styles.statRow}>
                <StatTile
                  label={t('common.in')}
                  value={format(view.totals.income)}
                  tone="positive"
                />
                <StatTile
                  label={t('common.out')}
                  value={format(view.totals.expense)}
                  tone="negative"
                />
              </View>
            </View>
          </Card>
        </View>
      </Sheet>

      <ConfirmSheet
        visible={confirmBulkDelete}
        onClose={() => setConfirmBulkDelete(false)}
        title={t('activity.deleteSelected', { count: selected.size })}
        body={t('activity.deleteSelectedConfirm', { count: selected.size })}
        detail={
          <View style={[styles.bulkDetail, { backgroundColor: theme.surfaceAlt }]}>
            <ThemedText type="label" themeColor="textTertiary">
              {t('activity.selected', { count: selected.size })}
            </ThemedText>
            <ThemedText type="subtitle">
              {format(
                sumCents(
                  view.groups
                    .flatMap((group) => group.transactions)
                    .filter((transaction) => selected.has(transaction.id))
                    .map((transaction) => absoluteCents(transaction.amount)),
                ),
              )}
            </ThemedText>
          </View>
        }
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={() => {
          selected.forEach((id) => deleteTransaction(id));
          haptics.warning();
          clearSelection();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    gap: Spacing.three,
  },
  headerBlock: {
    gap: Spacing.three,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.four,
    paddingBottom: Spacing.one,
  },
  empty: {
    paddingVertical: Spacing.five,
  },
  sheetBody: {
    gap: Spacing.four,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  sheetCard: {
    padding: Spacing.four,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.five,
  },
  noMargin: {
    marginBottom: Spacing.two,
  },
  selectionBar: {
    position: 'absolute',
    left: Spacing.four,
    right: Spacing.four,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    // One row rather than two. Stacked, the bar stood about 250px tall and —
    // with scrolling disabled during selection — put the rows beneath it out of
    // reach entirely.
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  selectionCount: {
    flex: 1,
  },
  selectionActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  selectionButton: {
    minHeight: 44,
    paddingHorizontal: Spacing.three,
  },
  bulkDetail: {
    gap: Spacing.one,
    padding: Spacing.four,
  },
});
