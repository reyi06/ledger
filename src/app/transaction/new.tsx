import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import {
  DEFAULT_EXPENSE_CATEGORY_ID,
  DEFAULT_INCOME_CATEGORY_ID,
  categoriesForKind,
} from '@/domain/categories';
import { TransactionFormSchema, type TransactionDirection } from '@/domain/models';
import { currencySymbol, negateCents, parseAmountInput } from '@/domain/money';
import { balancesByAccount } from '@/domain/selectors';
import { addDays, today } from '@/lib/date';
import type { DateOnly } from '@/domain/primitives';
import { useHaptics } from '@/hooks/use-haptics';
import { useTranslation } from '@/hooks/use-translation';
import { useAccounts, useTransactions } from '@/store/hooks';
import { useLedgerStore } from '@/store/ledger-store';
import { useSettingsStore } from '@/store/settings-store';
import { ThemedText } from '@/components/themed-text';
import { Block } from '@/components/motion';
import { Button, IconButton, Segmented } from '@/components/ui/controls';
import { AmountField, TextField } from '@/components/ui/inputs';
import { CategoryPicker, AccountPicker } from '@/components/ui/pickers';
import { DatePicker } from '@/components/ui/date-picker';
import { Screen } from '@/components/ui/screen';
import { Card, Chip, SectionHeader } from '@/components/ui/surface';

type Errors = Partial<Record<'amount' | 'categoryId' | 'accountId' | 'merchant' | 'note', string>>;

/**
 * Add or edit a transaction.
 *
 * Presented as a modal route. Editing is the same screen with an `id` param,
 * so the form logic lives in exactly one place.
 */
export default function TransactionFormScreen() {
  const haptics = useHaptics();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id?: string }>();
  const transactions = useTransactions();
  const accounts = useAccounts();
  const currency = useSettingsStore((state) => state.currency);

  const addTransaction = useLedgerStore((state) => state.addTransaction);
  const updateTransaction = useLedgerStore((state) => state.updateTransaction);

  const editing = useMemo(
    () => (params.id ? transactions.find((item) => item.id === params.id) : undefined),
    [params.id, transactions],
  );

  const activeAccounts = useMemo(
    () => accounts.filter((account) => !account.archived),
    [accounts],
  );
  const balances = useMemo(
    () => balancesByAccount(accounts, transactions),
    [accounts, transactions],
  );

  const [direction, setDirection] = useState<TransactionDirection>(
    editing ? (editing.amount < 0 ? 'expense' : 'income') : 'expense',
  );
  const [amount, setAmount] = useState(
    editing ? (Math.abs(editing.amount) / 100).toFixed(2) : '',
  );
  const [categoryId, setCategoryId] = useState(
    editing?.categoryId ??
      (direction === 'expense' ? DEFAULT_EXPENSE_CATEGORY_ID : DEFAULT_INCOME_CATEGORY_ID),
  );
  const [accountId, setAccountId] = useState(editing?.accountId ?? activeAccounts[0]?.id ?? '');
  const [date, setDate] = useState<DateOnly>(editing?.date ?? today());
  const [merchant, setMerchant] = useState(editing?.merchant ?? '');
  const [note, setNote] = useState(editing?.note ?? '');
  const [errors, setErrors] = useState<Errors>({});

  const switchDirection = (next: TransactionDirection) => {
    setDirection(next);
    // Categories are direction-specific, so reset to a sensible default.
    const valid = categoriesForKind(next).some((category) => category.id === categoryId);
    if (!valid) {
      setCategoryId(next === 'expense' ? DEFAULT_EXPENSE_CATEGORY_ID : DEFAULT_INCOME_CATEGORY_ID);
    }
    haptics.select();
  };

  const save = () => {
    const parsed = TransactionFormSchema.safeParse({
      amount,
      direction,
      categoryId,
      accountId,
      date,
      merchant,
      note,
    });

    if (!parsed.success) {
      const nextErrors: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string') nextErrors[key as keyof Errors] = t(issue.message);
      }
      setErrors(nextErrors);
      haptics.warning();
      return;
    }

    const magnitude = parseAmountInput(parsed.data.amount);
    if (magnitude === null) {
      setErrors({ amount: t('transaction.invalidAmount') });
      return;
    }

    const signed = parsed.data.direction === 'expense' ? negateCents(magnitude) : magnitude;

    const input = {
      accountId: parsed.data.accountId,
      categoryId: parsed.data.categoryId,
      amount: signed,
      date: parsed.data.date,
      merchant: parsed.data.merchant,
      note: parsed.data.note,
    };

    if (editing) {
      updateTransaction(editing.id, input);
    } else {
      addTransaction(input);
    }

    haptics.success();
    router.back();
  };

  if (activeAccounts.length === 0) {
    return (
      <Screen scroll={false} centerContent>
        <ThemedText type="subtitle">{t('transaction.noAccountsTitle')}</ThemedText>
        <ThemedText type="body" themeColor="textSecondary" style={styles.centerText}>
          {t('transaction.noAccountsBody')}
        </ThemedText>
        <Button
          title={t('transaction.addAccount')}
          onPress={() => router.replace('/account/new')}
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
            {editing ? t('transaction.edit') : t('transaction.new')}
          </ThemedText>
          <Button
            title={t('common.save')}
            variant="ghost"
            fullWidth={false}
            onPress={save}
            style={styles.saveButton}
          />
        </View>
      }>
      <Block>
        <Card style={styles.amountCard}>
          <Segmented
            value={direction}
            onChange={switchDirection}
            options={[
              { value: 'expense', label: t('transaction.expense') },
              { value: 'income', label: t('transaction.income') },
            ]}
          />
          <AmountField
            value={amount}
            onChangeText={(value) => {
              setAmount(value);
              if (errors.amount) setErrors((current) => ({ ...current, amount: undefined }));
            }}
            symbol={currencySymbol(currency)}
            error={errors.amount}
            tone={direction === 'expense' ? 'negative' : 'positive'}
            autoFocus={!editing}
          />
        </Card>
      </Block>

      <View style={styles.section}>
        <SectionHeader title={t('transaction.category')} />
        <CategoryPicker
          kind={direction}
          value={categoryId}
          onChange={(id) => {
            setCategoryId(id);
            setErrors((current) => ({ ...current, categoryId: undefined }));
          }}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title={t('transaction.account')} />
        <AccountPicker
          accounts={activeAccounts}
          balances={balances}
          value={accountId}
          onChange={(id) => {
            setAccountId(id);
            setErrors((current) => ({ ...current, accountId: undefined }));
          }}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title={t('transaction.date')} />
        <View style={styles.chipRow}>
          <Chip
            label={t('transaction.today')}
            selected={date === today()}
            onPress={() => setDate(today())}
          />
          <Chip
            label={t('transaction.yesterday')}
            selected={date === addDays(today(), -1)}
            onPress={() => setDate(addDays(today(), -1))}
          />
          <Chip
            label={t('transaction.twoDaysAgo')}
            selected={date === addDays(today(), -2)}
            onPress={() => setDate(addDays(today(), -2))}
          />
        </View>
        <DatePicker value={date} onChange={setDate} maxDate={today()} />
      </View>

      <View style={styles.section}>
        <SectionHeader title={t('transaction.details')} />
        <TextField
          label={t('transaction.merchant')}
          value={merchant}
          onChangeText={setMerchant}
          placeholder={t('transaction.merchantPlaceholder')}
          error={errors.merchant}
          maxLength={60}
          icon="storefront-outline"
        />
        <TextField
          label={t('transaction.note')}
          value={note}
          onChangeText={setNote}
          placeholder={t('transaction.notePlaceholder')}
          error={errors.note}
          maxLength={200}
          multiline
          numberOfLines={3}
          icon="document-text-outline"
        />
      </View>

      <Button
        title={editing ? t('transaction.saveChanges') : t('common.addTransaction')}
        icon="checkmark"
        onPress={save}
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
  saveButton: {
    paddingHorizontal: Spacing.two,
  },
  amountCard: {
    gap: Spacing.three,
  },
  section: {
    gap: Spacing.two,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  centerText: {
    textAlign: 'center',
  },
});
