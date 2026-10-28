import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { TransferFormSchema } from '@/domain/models';
import { currencySymbol, parseAmountInput } from '@/domain/money';
import { balancesByAccount } from '@/domain/selectors';
import { today } from '@/lib/date';
import type { DateOnly } from '@/domain/primitives';
import { useHaptics } from '@/hooks/use-haptics';
import { useTranslation } from '@/hooks/use-translation';
import { useAccounts, useTransactions } from '@/store/hooks';
import { useLedgerStore } from '@/store/ledger-store';
import { useSettingsStore } from '@/store/settings-store';
import { ThemedText } from '@/components/themed-text';
import { Block } from '@/components/motion';
import { Button, IconButton } from '@/components/ui/controls';
import { AmountField, TextField } from '@/components/ui/inputs';
import { AccountPicker } from '@/components/ui/pickers';
import { DatePicker } from '@/components/ui/date-picker';
import { EmptyState } from '@/components/ui/feedback';
import { Screen } from '@/components/ui/screen';
import { Card, SectionHeader } from '@/components/ui/surface';

/**
 * Move money between two of the user's own accounts.
 *
 * Writes two linked transactions — an outflow and an inflow — under the
 * transfer categories, so account balances stay right while income and expense
 * reporting ignores the movement.
 */
export default function TransferScreen() {
  const haptics = useHaptics();
  const { t } = useTranslation();
  const accounts = useAccounts();
  const transactions = useTransactions();
  const currency = useSettingsStore((state) => state.currency);
  const addTransfer = useLedgerStore((state) => state.addTransfer);

  const active = useMemo(() => accounts.filter((account) => !account.archived), [accounts]);
  const balances = useMemo(
    () => balancesByAccount(accounts, transactions),
    [accounts, transactions],
  );

  const [fromAccountId, setFromAccountId] = useState(active[0]?.id ?? '');
  const [toAccountId, setToAccountId] = useState(active[1]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<DateOnly>(today());
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{ amount?: string; toAccountId?: string }>({});

  const save = () => {
    const parsed = TransferFormSchema.safeParse({
      amount,
      fromAccountId,
      toAccountId,
      date,
      note,
    });

    if (!parsed.success) {
      const nextErrors: { amount?: string; toAccountId?: string } = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === 'amount' || key === 'toAccountId') nextErrors[key] = t(issue.message);
      }
      setErrors(nextErrors);
      haptics.warning();
      return;
    }

    const value = parseAmountInput(parsed.data.amount);
    if (value === null || value <= 0) {
      setErrors({ amount: t('transfer.amountPositive') });
      return;
    }

    addTransfer({
      fromAccountId: parsed.data.fromAccountId,
      toAccountId: parsed.data.toAccountId,
      amount: value,
      date: parsed.data.date,
      note: parsed.data.note,
    });

    haptics.success();
    router.back();
  };

  if (active.length < 2) {
    return (
      <Screen scroll={false} centerContent>
        <EmptyState
          icon="swap-horizontal-outline"
          title={t('transfer.twoAccountsTitle')}
          body={t('transfer.twoAccountsBody')}
          actionLabel={t('transfer.addAccount')}
          onAction={() => router.replace('/account/new')}
        />
      </Screen>
    );
  }

  return (
    <Screen
      bottomInset={Spacing.four}
      header={
        <View style={styles.header}>
          <IconButton
            icon="close"
            accessibilityLabel={t('common.cancel')}
            onPress={() => router.back()}
          />
          <ThemedText type="heading" style={styles.headerTitle}>
            {t('transfer.title')}
          </ThemedText>
          <Button title={t('common.save')} variant="ghost" fullWidth={false} onPress={save} />
        </View>
      }>
      <Block>
        <Card>
          <AmountField
            value={amount}
            onChangeText={(value) => {
              setAmount(value);
              setErrors((current) => ({ ...current, amount: undefined }));
            }}
            symbol={currencySymbol(currency)}
            error={errors.amount}
            autoFocus
          />
        </Card>
      </Block>

      <View style={styles.section}>
        <SectionHeader title={t('transfer.from')} />
        <AccountPicker
          accounts={active}
          balances={balances}
          value={fromAccountId}
          onChange={(id) => {
            setFromAccountId(id);
            if (toAccountId === id) {
              setToAccountId(active.find((account) => account.id !== id)?.id ?? '');
            }
          }}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title={t('transfer.to')} />
        <AccountPicker
          accounts={active.filter((account) => account.id !== fromAccountId)}
          balances={balances}
          value={toAccountId}
          onChange={(id) => {
            setToAccountId(id);
            setErrors((current) => ({ ...current, toAccountId: undefined }));
          }}
        />
        {errors.toAccountId ? (
          <ThemedText type="caption" themeColor="negative">
            {errors.toAccountId}
          </ThemedText>
        ) : null}
      </View>

      <View style={styles.section}>
        <SectionHeader title={t('transfer.when')} />
        <DatePicker value={date} onChange={setDate} maxDate={today()} />
      </View>

      <TextField
        label={t('transaction.note')}
        value={note}
        onChangeText={setNote}
        placeholder={t('transfer.notePlaceholder')}
        maxLength={200}
        icon="document-text-outline"
      />

      <Button title={t('transfer.submit')} icon="swap-horizontal" onPress={save} />
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
  section: {
    gap: Spacing.two,
  },
});
