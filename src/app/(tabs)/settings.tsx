import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { CurrencyCodes, currencySymbol } from '@/domain/money';
import {
  AUTO_LOCK_OPTIONS,
  autoLockKey,
  LANGUAGE_LABELS,
  LanguageCodes,
  THEME_PREFERENCE_LABELS,
} from '@/domain/settings';
import { balancesByAccount } from '@/domain/selectors';
import { useHaptics } from '@/hooks/use-haptics';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { notify } from '@/lib/notify';
import { initialsOf } from '@/lib/format';
import { exportTransactionsCsv } from '@/services/export';
import { useAccounts, useRecurringView, useTransactions } from '@/store/hooks';
import { useAuthStore } from '@/store/auth-store';
import { useLedgerStore } from '@/store/ledger-store';
import { useSettingsStore } from '@/store/settings-store';
import { ThemedText } from '@/components/themed-text';
import { Block, Reveal } from '@/components/motion';
import { AccountRow } from '@/components/account-row';
import { ChangePinSheet } from '@/components/change-pin-sheet';
import { SettingsRow } from '@/components/settings-row';
import { Button, Segmented, Toggle } from '@/components/ui/controls';
import { ConfirmSheet } from '@/components/ui/dialogs';
import { Card, Chip, SectionHeader } from '@/components/ui/surface';
import { Screen, ScreenHeader } from '@/components/ui/screen';

/** Preferences, security, accounts and data management. */
export default function SettingsScreen() {
  const theme = useTheme();
  const haptics = useHaptics();
  const { t } = useTranslation();

  const accounts = useAccounts();
  const transactions = useTransactions();
  const recurring = useRecurringView();

  const profile = useAuthStore((state) => state.profile);
  const biometrics = useAuthStore((state) => state.biometrics);
  const lock = useAuthStore((state) => state.lock);
  const signOut = useAuthStore((state) => state.signOut);
  const setBiometricsEnabled = useAuthStore((state) => state.setBiometricsEnabled);

  const settings = useSettingsStore();
  const resetToDemoData = useLedgerStore((state) => state.resetToDemoData);
  const clearAllData = useLedgerStore((state) => state.clearAllData);

  const [pinSheetOpen, setPinSheetOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [eraseOpen, setEraseOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);

  const balances = useMemo(() => balancesByAccount(accounts, transactions), [accounts, transactions]);

  const autoLock = autoLockKey(settings.autoLockMinutes);

  const runExport = async () => {
    setExporting(true);
    try {
      await exportTransactionsCsv(transactions, accounts);
      haptics.success();
    } catch (error) {
      haptics.error();
      notify('Export failed', error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Screen
        bottomInset={Spacing.four}
        header={<ScreenHeader title={t('tab.settings')} subtitle={t('settings.preferences')} />}>
        <Reveal>
        <Card>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: theme.tintMuted }]}>
              <ThemedText type="subtitle" style={{ color: theme.sageText }}>
                {initialsOf(profile?.displayName ?? 'Ledger')}
              </ThemedText>
            </View>
            <View style={styles.profileText}>
              <ThemedText type="subtitle">{profile?.displayName ?? 'Ledger'}</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                {t('settings.offline')}
              </ThemedText>
            </View>
          </View>
        </Card>
        </Reveal>

        <View style={styles.section}>
          <SectionHeader
            title={t('overview.accounts')}
            action={t('common.add')}
            onAction={() => router.push('/account/new')}
          />
          <Card padded={false} style={styles.listPlain}>
            {accounts.length === 0 ? (
              <View style={styles.emptyBlock}>
                <ThemedText type="body" themeColor="textSecondary">
                  {t('settings.accountsEmpty')}
                </ThemedText>
              </View>
            ) : (
              <View style={styles.list}>
                {accounts.map((account, index) => (
                  <AccountRow
                    key={account.id}
                    account={account}
                    balance={balances.get(account.id) ?? account.openingBalance}
                    showDivider={index < accounts.length - 1}
                    onPress={() =>
                      router.push({ pathname: '/account/new', params: { id: account.id } })
                    }
                  />
                ))}
              </View>
            )}
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader title={t('settings.automation')} />
          <Card padded={false} style={styles.listPlain}>
            <View style={styles.list}>
              <SettingsRow
                icon="repeat"
                label={t('settings.recurring')}
                description={t('settings.recurringDescription', {
                  count: recurring.rules.length,
                  paused: recurring.pausedCount,
                })}
                onPress={() => router.push('/recurring')}
              />
              <SettingsRow
                icon="swap-horizontal"
                label={t('settings.transfer')}
                description={t('settings.transferDescription')}
                onPress={() => router.push('/transfer')}
              />
              <SettingsRow
                icon="download-outline"
                label={exporting ? t('settings.exportPreparing') : t('settings.exportCsv')}
                description={t('settings.exportDescription')}
                onPress={() => void runExport()}
              />
              <SettingsRow
                icon="sparkles-outline"
                label={t('settings.replayTour')}
                description={t('settings.replayTourDescription')}
                showDivider={false}
                onPress={() => {
                  haptics.press();
                  settings.setHasSeenTour(false);
                  router.push('/tour');
                }}
              />
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader title={t('settings.appearance')} />
          <Card>
            <ThemedText type="label" themeColor="textSecondary" style={styles.fieldLabel}>
              {t('settings.theme')}
            </ThemedText>
            <Segmented
              value={settings.theme}
              onChange={(value) => {
                haptics.select();
                settings.setTheme(value);
              }}
              options={(['system', 'light', 'dark'] as const).map((value) => ({
                value,
                label: t(THEME_PREFERENCE_LABELS[value]),
              }))}
            />

            <ThemedText type="label" themeColor="textSecondary" style={styles.fieldLabel}>
              {t('settings.currency')}
            </ThemedText>
            <View style={styles.chipRow}>
              {CurrencyCodes.map((code) => (
                <Chip
                  key={code}
                  label={`${currencySymbol(code)} ${code}`}
                  selected={settings.currency === code}
                  onPress={() => {
                    haptics.select();
                    settings.setCurrency(code);
                  }}
                />
              ))}
            </View>

            <ThemedText type="label" themeColor="textSecondary" style={styles.fieldLabel}>
              {t('settings.language')}
            </ThemedText>
            <View style={styles.chipRow}>
              {LanguageCodes.map((code) => (
                <Chip
                  key={code}
                  label={LANGUAGE_LABELS[code]}
                  selected={settings.language === code}
                  onPress={() => {
                    haptics.select();
                    settings.setLanguage(code);
                  }}
                />
              ))}
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader title={t('settings.security')} />
          <Card padded={false} style={styles.listPlain}>
            <View style={styles.list}>
              <SettingsRow
                icon="finger-print"
                label={t('settings.biometrics', { label: biometrics.label })}
                description={
                  biometrics.available
                    ? t('settings.biometricsDescription')
                    : t('settings.biometricsUnavailable')
                }
                accessory={
                  <Toggle
                    value={Boolean(profile?.biometricsEnabled)}
                    disabled={!biometrics.available}
                    onChange={(value) => {
                      void setBiometricsEnabled(value).then((ok) => {
                        if (ok) haptics.success();
                      });
                    }}
                  />
                }
              />
              <SettingsRow
                icon="keypad-outline"
                label={t('settings.changePin')}
                onPress={() => setPinSheetOpen(true)}
              />
              <SettingsRow
                icon="timer-outline"
                label={t('settings.autoLock')}
                description={t(autoLock.key, autoLock.params)}
                showDivider
              />
              <View style={styles.autoLockRow}>
                {AUTO_LOCK_OPTIONS.map((minutes) => (
                  <Chip
                    key={minutes}
                    label={minutes === 0 ? t('settings.never') : t('settings.minutesShort', { minutes })}
                    selected={settings.autoLockMinutes === minutes}
                    onPress={() => {
                      haptics.select();
                      settings.setAutoLockMinutes(minutes);
                    }}
                  />
                ))}
              </View>
              <SettingsRow
                icon="lock-closed-outline"
                label={t('settings.lockNow')}
                onPress={() => {
                  haptics.press();
                  lock();
                }}
              />
              <SettingsRow
                icon="eye-off-outline"
                label={t('settings.hideBalances')}
                description={t('settings.hideBalancesDescription')}
                accessory={
                  <Toggle
                    value={settings.hideBalances}
                    onChange={(value) => settings.setHideBalances(value)}
                  />
                }
              />
              <SettingsRow
                icon="volume-medium-outline"
                label={t('settings.haptics')}
                description={t('settings.hapticsDescription')}
                accessory={
                  <Toggle
                    value={settings.hapticsEnabled}
                    onChange={(value) => settings.setHapticsEnabled(value)}
                  />
                }
                showDivider={false}
              />
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader title={t('settings.data')} />
          <Card padded={false} style={styles.listPlain}>
            <View style={styles.list}>
              <SettingsRow
                icon="refresh-outline"
                label={t('settings.loadDemo')}
                description={t('settings.loadDemoDescription')}
                onPress={() => setDemoOpen(true)}
              />
              <SettingsRow
                icon="trash-outline"
                label={t('settings.eraseAll')}
                description={t('settings.eraseDescription')}
                tone="danger"
                onPress={() => setEraseOpen(true)}
              />
              <SettingsRow
                icon="log-out-outline"
                label={t('settings.signOut')}
                description={t('settings.signOutDescription')}
                tone="danger"
                showDivider={false}
                onPress={() => setSignOutOpen(true)}
              />
            </View>
          </Card>
        </View>

        <Block>
          <Card>
            <View style={styles.aboutRow}>
              <View style={styles.aboutText}>
                <ThemedText type="heading">Ledger</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {t('settings.version', {
                    version: Constants.expoConfig?.version ?? '1.0.0',
                  })}
                </ThemedText>
              </View>
              <Ionicons name="shield-checkmark" size={22} color={theme.positive} />
            </View>
            <ThemedText type="caption" themeColor="textTertiary" style={styles.aboutNote}>
              {t('settings.privacyNote')}
            </ThemedText>
          </Card>
        </Block>

        <Button
          title={t('settings.lockLedger')}
          icon="lock-closed"
          variant="secondary"
          onPress={() => lock()}
        />
      </Screen>

      <ChangePinSheet visible={pinSheetOpen} onClose={() => setPinSheetOpen(false)} />

      <ConfirmSheet
        visible={demoOpen}
        onClose={() => setDemoOpen(false)}
        title={t('settings.loadDemo')}
        body={t('settings.loadDemoConfirm')}
        confirmLabel={t('common.continue')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          resetToDemoData();
          haptics.success();
        }}
      />

      <ConfirmSheet
        visible={eraseOpen}
        onClose={() => setEraseOpen(false)}
        title={t('settings.eraseAll')}
        body={t('settings.eraseConfirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={() => {
          clearAllData();
          haptics.warning();
        }}
      />

      <ConfirmSheet
        visible={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        title={t('settings.signOut')}
        body={t('settings.signOutConfirm')}
        confirmLabel={t('settings.signOut')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={() => void signOut()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    flex: 1,
    gap: 1,
  },
  section: {
    gap: Spacing.two,
  },
  list: {
    paddingHorizontal: Spacing.three,
  },
  /**
   * Rows already carry hairline dividers, so the container does not need a
   * border. A ruled list on the page reads as a table; a bordered box reads as a
   * card, which is the container this system deliberately avoids.
   */
  listPlain: {
    borderWidth: 0,
  },
  emptyBlock: {
    padding: Spacing.three,
  },
  fieldLabel: {
    marginBottom: Spacing.two,
    letterSpacing: 0.6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  autoLockRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingBottom: Spacing.three,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  aboutText: {
    flex: 1,
    gap: 1,
  },
  aboutNote: {
    marginTop: Spacing.two,
  },
});
