import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import {
  DEFAULT_EXPENSE_CATEGORY_ID,
  DEFAULT_INCOME_CATEGORY_ID,
  categoriesForKind,
} from '@/domain/categories';
import {
  FREQUENCY_LABELS,
  Frequencies,
  RecurringFormSchema,
  type Frequency,
  type TransactionDirection,
} from '@/domain/models';
import { currencySymbol, negateCents, parseAmountInput } from '@/domain/money';
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
import { Button, IconButton, Segmented } from '@/components/ui/controls';
import { AmountField, TextField } from '@/components/ui/inputs';
import { CategoryPicker, AccountPicker } from '@/components/ui/pickers';
import { DatePicker } from '@/components/ui/date-picker';
import { Screen } from '@/components/ui/screen';
import { Card, Chip, SectionHeader } from '@/components/ui/surface';

type Errors = Partial<Record<'amount' | 'categoryId' | 'accountId' | 'merchant' | 'note', string>>;

/** Create or edit a recurring rule. Past start dates backfill immediately. */
export default function RecurringFormScreen() {
  const haptics = useHaptics();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id?: string }>();
  const accounts = useAccounts();
  const transactions = useTransactions();
  const currency = useSettingsStore((state) => state.currency);

  const rules = useLedgerStore((state) => state.recurring);
  const addRecurring = useLedgerStore((state) => state.addRecurring);
  const updateRecurring = useLedgerStore((state) => state.updateRecurring);

  const editing = useMemo(
    () => (params.id ? rules.find((rule) => rule.id === params.id) : undefined),
    [params.id, rules],
  );

  const active = useMemo(() => accounts.filter((account) => !account.archived), [accounts]);
  const balances = useMemo(
    () => balancesByAccount(accounts, transactions),
    [accounts, transactions],
  );

  const [direction, setDirection] = useState<TransactionDirection>(
    editing ? (editing.amount < 0 ? 'expense' : 'income') : 'expense',
  );
  const [amount, setAmount] = useState(editing ? (Math.abs(editing.amount) / 100).toFixed(2) : '');
  const [categoryId, setCategoryId] = useState(
    editing?.categoryId ??
      (direction === 'expense' ? DEFAULT_EXPENSE_CATEGORY_ID : DEFAULT_INCOME_CATEGORY_ID),
  );
  const [accountId, setAccountId] = useState(editing?.accountId ?? active[0]?.id ?? '');
  const [frequency, setFrequency] = useState<Frequency>(editing?.frequency ?? 'monthly');
  const [startDate, setStartDate] = useState<DateOnly>(editing?.startDate ?? today());
  const [merchant, setMerchant] = useState(editing?.merchant ?? '');
  const [note, setNote] = useState(editing?.note ?? '');
  const [errors, setErrors] = useState<Errors>({});

  const save = () => {
    const parsed = RecurringFormSchema.safeParse({
      amount,
      direction,
      categoryId,
      accountId,
      frequency,
      startDate,
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
      setErrors({ amount: 'Enter a valid amount' });
      return;
    }

    const signed = parsed.data.direction === 'expense' ? negateCents(magnitude) : magnitude;

    const input = {
      accountId: parsed.data.accountId,
      categoryId: parsed.data.categoryId,
      amount: signed,
      frequency: parsed.data.frequency,
      startDate: parsed.data.startDate,
      merchant: parsed.data.merchant,
      note: parsed.data.note,
    };

    if (editing) {
      updateRecurring(editing.id, input);
    } else {
      addRecurring(input);
    }

    haptics.success();
    router.back();
  };

  return (
    <Screen
      bottomInset={Spacing.four}
      header={
        <View style={styles.header}>
          <IconButton icon="close" accessibilityLabel={t('common.cancel')} onPress={() => router.back()} />
          <ThemedText type="heading" style={styles.headerTitle}>
            {editing ? t('recurring.edit') : t('recurring.new')}
          </ThemedText>
          <Button title={t('common.save')} variant="ghost" fullWidth={false} onPress={save} />
        </View>
      }>
      <Block>
        <Card style={styles.amountCard}>
          <Segmented
            value={direction}
            onChange={(next) => {
              setDirection(next);
              const valid = categoriesForKind(next).some((category) => category.id === categoryId);
              if (!valid) {
                setCategoryId(
                  next === 'expense' ? DEFAULT_EXPENSE_CATEGORY_ID : DEFAULT_INCOME_CATEGORY_ID,
                );
              }
              haptics.select();
            }}
            options={[
              { value: 'expense', label: t('transaction.expense') },
              { value: 'income', label: t('transaction.income') },
            ]}
          />
          <AmountField
            value={amount}
            onChangeText={(value) => {
              setAmount(value);
              setErrors((current) => ({ ...current, amount: undefined }));
            }}
            symbol={currencySymbol(currency)}
            error={errors.amount ? t(errors.amount) : undefined}
            tone={direction === 'expense' ? 'negative' : 'positive'}
          />
        </Card>
      </Block>

      <View style={styles.section}>
        <SectionHeader title={t('recurring.frequency')} />
        <View style={styles.chipRow}>
          {Frequencies.map((option) => (
            <Chip
              key={option}
              label={t(FREQUENCY_LABELS[option])}
              selected={frequency === option}
              onPress={() => {
                haptics.select();
                setFrequency(option);
              }}
            />
          ))}
        </View>
      </View>

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
          accounts={active}
          balances={balances}
          value={accountId}
          onChange={(id) => {
            setAccountId(id);
            setErrors((current) => ({ ...current, accountId: undefined }));
          }}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title={t('recurring.startDate')} />
        <ThemedText type="caption" themeColor="textTertiary">
          {t('recurring.backfillNote')}
        </ThemedText>
        <DatePicker value={startDate} onChange={setStartDate} />
      </View>

      <View style={styles.section}>
        <SectionHeader title={t('transaction.details')} />
        <TextField
          label={t('recurring.label')}
          value={merchant}
          onChangeText={setMerchant}
          placeholder={t('recurring.labelPlaceholder')}
          error={errors.merchant ? t(errors.merchant) : undefined}
          maxLength={60}
          icon="pricetag-outline"
        />
        <TextField
          label={t('transaction.note')}
          value={note}
          onChangeText={setNote}
          placeholder={t('transfer.notePlaceholder')}
          error={errors.note ? t(errors.note) : undefined}
          maxLength={200}
          icon="document-text-outline"
        />
      </View>

      <Button
        title={editing ? t('transaction.saveChanges') : t('recurring.new')}
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
});
