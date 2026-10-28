import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import {
  ACCOUNT_KIND_LABELS,
  AccountFormSchema,
  AccountKinds,
  type AccountKind,
} from '@/domain/models';
import { parseAmountInput } from '@/domain/money';
import { useHaptics } from '@/hooks/use-haptics';
import { useTranslation } from '@/hooks/use-translation';
import { useAccounts, useAccountBalance, useMoney } from '@/store/hooks';
import { useLedgerStore } from '@/store/ledger-store';
import { ThemedText } from '@/components/themed-text';
import { Block } from '@/components/motion';
import { AccountRow } from '@/components/account-row';
import { Button, IconButton } from '@/components/ui/controls';
import { ConfirmSheet } from '@/components/ui/dialogs';
import { TextField } from '@/components/ui/inputs';
import { Screen } from '@/components/ui/screen';
import { Card, Chip, Pill, SectionHeader } from '@/components/ui/surface';

type Errors = Partial<Record<'name' | 'openingBalance' | 'institution', string>>;

/** Create or edit an account. */
export default function AccountFormScreen() {
  const haptics = useHaptics();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id?: string }>();
  const accounts = useAccounts();

  const addAccount = useLedgerStore((state) => state.addAccount);
  const updateAccount = useLedgerStore((state) => state.updateAccount);
  const setAccountArchived = useLedgerStore((state) => state.setAccountArchived);
  const deleteAccount = useLedgerStore((state) => state.deleteAccount);

  const editing = useMemo(
    () => (params.id ? accounts.find((account) => account.id === params.id) : undefined),
    [params.id, accounts],
  );

  const balance = useAccountBalance(editing?.id ?? '');
  const { format } = useMoney();

  const [name, setName] = useState(editing?.name ?? '');
  const [kind, setKind] = useState<AccountKind>(editing?.kind ?? 'checking');
  const [institution, setInstitution] = useState(editing?.institution ?? '');
  const [openingBalance, setOpeningBalance] = useState(
    editing ? (editing.openingBalance / 100).toFixed(2) : '',
  );
  const [errors, setErrors] = useState<Errors>({});
  const [deleteOpen, setDeleteOpen] = useState(false);

  const save = () => {
    const parsed = AccountFormSchema.safeParse({ name, kind, institution, openingBalance });

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

    const opening = parseAmountInput(parsed.data.openingBalance);
    if (opening === null) {
      setErrors({ openingBalance: 'Enter a valid amount' });
      return;
    }

    const input = {
      name: parsed.data.name,
      kind: parsed.data.kind,
      institution: parsed.data.institution,
      openingBalance: opening,
    };

    if (editing) {
      updateAccount(editing.id, input);
    } else {
      addAccount(input);
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
            {editing ? t('account.edit') : t('account.new')}
          </ThemedText>
          <Button title={t('common.save')} variant="ghost" fullWidth={false} onPress={save} />
        </View>
      }>
      {editing ? (
        <Block>
          <Card>
            <View style={styles.balanceRow}>
              <View style={styles.balanceText}>
                <ThemedText type="label" themeColor="textSecondary">
                  {t('account.currentBalance')}
                </ThemedText>
                <ThemedText type="title">{format(balance)}</ThemedText>
              </View>
              {editing.archived ? <Pill label={t('account.archived')} tone="warning" /> : null}
            </View>
          </Card>
        </Block>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title={t('account.details')} />
        <TextField
          label={t('account.name')}
          value={name}
          onChangeText={(value) => {
            setName(value);
            setErrors((current) => ({ ...current, name: undefined }));
          }}
          placeholder={t('account.namePlaceholder')}
          error={errors.name ? t(errors.name) : undefined}
          autoFocus={!editing}
          maxLength={40}
          icon="wallet-outline"
        />
        <TextField
          label={t('account.institution')}
          value={institution}
          onChangeText={setInstitution}
          placeholder={t('account.institutionPlaceholder')}
          error={errors.institution ? t(errors.institution) : undefined}
          maxLength={40}
          icon="business-outline"
        />
        <TextField
          label={t('account.openingBalance')}
          value={openingBalance}
          onChangeText={(value) => {
            setOpeningBalance(value);
            setErrors((current) => ({ ...current, openingBalance: undefined }));
          }}
          placeholder="0.00"
          keyboardType="decimal-pad"
          error={errors.openingBalance ? t(errors.openingBalance) : undefined}
          hint={t('account.openingBalanceHint')}
          icon="cash-outline"
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title={t('account.kind')} />
        <View style={styles.chipRow}>
          {AccountKinds.map((option) => (
            <Chip
              key={option}
              label={t(ACCOUNT_KIND_LABELS[option])}
              selected={kind === option}
              onPress={() => {
                haptics.select();
                setKind(option);
              }}
            />
          ))}
        </View>
      </View>

      <Button title={editing ? t('account.saveChanges') : t('settings.addAccount')} icon="checkmark" onPress={save} />

      {editing ? (
        <View style={styles.section}>
          <SectionHeader title={t('account.manage')} />
          <Button
            title={editing.archived ? t('account.restore') : t('account.archive')}
            variant="secondary"
            icon="archive-outline"
            onPress={() => {
              setAccountArchived(editing.id, !editing.archived);
              haptics.tap();
              router.back();
            }}
          />
          <Button
            title={t('account.delete')}
            variant="destructive"
            icon="trash-outline"
            onPress={() => setDeleteOpen(true)}
          />
        </View>
      ) : null}

      {editing ? (
        <ConfirmSheet
          visible={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          title={t('account.delete')}
          body={t('account.deleteConfirm')}
          detail={<AccountRow account={editing} balance={balance} showDivider={false} />}
          confirmLabel={t('common.delete')}
          cancelLabel={t('common.cancel')}
          destructive
          onConfirm={() => {
            deleteAccount(editing.id);
            haptics.warning();
            router.back();
          }}
        />
      ) : null}
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
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceText: {
    gap: Spacing.half,
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
