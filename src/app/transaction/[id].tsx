import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { categoryLabel, getCategory } from '@/domain/categories';
import { ACCOUNT_KIND_LABELS } from '@/domain/models';
import { formatDayLong, formatRelativeDay } from '@/lib/date';
import { useHaptics } from '@/hooks/use-haptics';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { useAccounts, useMoney, useTransaction } from '@/store/hooks';
import { useLedgerStore } from '@/store/ledger-store';
import { ThemedText } from '@/components/themed-text';
import { TransactionRow } from '@/components/transaction-row';
import { Block } from '@/components/motion';
import { AmountText } from '@/components/ui/amount-text';
import { Button, IconButton } from '@/components/ui/controls';
import { CategoryMark } from '@/components/ui/category-mark';
import { ConfirmSheet } from '@/components/ui/dialogs';
import { EmptyState } from '@/components/ui/feedback';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { Card, Pill } from '@/components/ui/surface';

/** Full detail for a single transaction, plus edit / duplicate / delete. */
export default function TransactionDetailScreen() {
  const haptics = useHaptics();
  const { t } = useTranslation();
  const { format } = useMoney();
  const params = useLocalSearchParams<{ id: string }>();
  const transaction = useTransaction(params.id);
  const accounts = useAccounts();

  const deleteTransaction = useLedgerStore((state) => state.deleteTransaction);
  const duplicateTransaction = useLedgerStore((state) => state.duplicateTransaction);

  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!transaction) {
    return (
      <Screen scroll={false} centerContent>
        <EmptyState
          icon="alert-circle-outline"
          title={t('transaction.notFound')}
          body={t('transaction.notFoundBody')}
          actionLabel={t('common.goBack')}
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const account = accounts.find((candidate) => candidate.id === transaction.accountId);
  const category = getCategory(transaction.categoryId);
  const isExpense = transaction.amount < 0;

  return (
    <Screen
      bottomInset={Spacing.four}
      header={
        <View style={styles.header}>
          <IconButton icon="chevron-back" accessibilityLabel={t('common.goBack')} onPress={() => router.back()} />
          <ThemedText type="heading" style={styles.headerTitle}>
            {t('transaction.detail')}
          </ThemedText>
          <IconButton
            icon="create-outline"
            accessibilityLabel={t('transaction.edit')}
            onPress={() => router.push(`/transaction/new?id=${transaction.id}`)}
          />
        </View>
      }>
      <Block style={styles.hero}>
        <CategoryMark categoryId={transaction.categoryId} size={64} />
        <ThemedText type="body" themeColor="textSecondary">
          {transaction.merchant?.trim() || categoryLabel(transaction.categoryId)}
        </ThemedText>
        <AmountText value={transaction.amount} showSign type="hero" />
        <Pill
          label={isExpense ? t('transaction.expense') : t('transaction.income')}
          tone={isExpense ? 'negative' : 'positive'}
        />
      </Block>

      <Card padded={false}>
        <View style={styles.list}>
          <ListRow
            leading={<IconIon name="calendar-outline" />}
            title={t('transaction.date')}
            subtitle={formatRelativeDay(transaction.date)}
            trailing={
              <ThemedText type="caption" themeColor="textTertiary">
                {formatDayLong(transaction.date)}
              </ThemedText>
            }
          />
          <ListRow
            leading={<IconIon name="pricetag-outline" />}
            title={t('transaction.category')}
            subtitle={category.label}
          />
          <ListRow
            leading={<IconIon name="wallet-outline" />}
            title={t('transaction.account')}
            subtitle={
              account
                ? `${account.name}${account.institution ? ` · ${account.institution}` : ''}`
                : t('transaction.unknownAccount')
            }
            trailing={
              account ? (
                <ThemedText type="caption" themeColor="textTertiary">
                  {t(ACCOUNT_KIND_LABELS[account.kind])}
                </ThemedText>
              ) : undefined
            }
          />
          <ListRow
            leading={<IconIon name="document-text-outline" />}
            title={t('transaction.note')}
            subtitle={transaction.note?.trim() || t('transaction.noNote')}
            showDivider={false}
          />
        </View>
      </Card>

      <Block>
        <Card>
          <ThemedText type="label" themeColor="textSecondary">
            {t('transaction.amount')}
          </ThemedText>
          <ThemedText type="body" themeColor="textSecondary" style={styles.amountNote}>
            {t('transaction.recorded', {
              amount: format(transaction.amount, { accounting: true }),
              when: formatRelativeDay(transaction.date),
            })}
          </ThemedText>
        </Card>
      </Block>

      <View style={styles.actions}>
        <Button
          title={t('common.edit')}
          icon="create-outline"
          variant="secondary"
          fullWidth={false}
          style={styles.actionButton}
          onPress={() => router.push(`/transaction/new?id=${transaction.id}`)}
        />
        <Button
          title={t('common.duplicate')}
          icon="copy-outline"
          variant="secondary"
          fullWidth={false}
          style={styles.actionButton}
          onPress={() => {
            const copy = duplicateTransaction(transaction.id);
            haptics.success();
            if (copy) router.replace(`/transaction/${copy.id}`);
          }}
        />
      </View>

      <Button
        title={t('transaction.delete')}
        icon="trash-outline"
        variant="destructive"
        onPress={() => setDeleteOpen(true)}
      />

      <ConfirmSheet
        visible={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t('transaction.delete')}
        body={t('transaction.deleteConfirm')}
        detail={<TransactionRow transaction={transaction} showDivider={false} />}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={() => {
          deleteTransaction(transaction.id);
          haptics.warning();
          router.back();
        }}
      />
    </Screen>
  );
}

function IconIon({ name }: { name: React.ComponentProps<typeof Ionicons>['name'] }) {
  const theme = useTheme();
  return <Ionicons name={name} size={20} color={theme.textSecondary} />;
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
  hero: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  list: {
    paddingHorizontal: Spacing.three,
  },
  amountNote: {
    marginTop: Spacing.one,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionButton: {
    flex: 1,
  },
  card: {
  },
});
