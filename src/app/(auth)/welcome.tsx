import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { ProfileFormSchema } from '@/domain/auth';
import { useHaptics } from '@/hooks/use-haptics';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { ThemedText } from '@/components/themed-text';
import { BotanicalMark } from '@/components/botanical-mark';
import { PAGE_WIND, Wind } from '@/components/wind';
import { Block, Reveal } from '@/components/motion';
import { Button } from '@/components/ui/controls';
import { TextField } from '@/components/ui/inputs';
import { Screen } from '@/components/ui/screen';

/**
 * Onboarding step one: who is this ledger for?
 * The name is only used for the greeting on the lock screen.
 *
 * The lockup is the wallet mark over the wordmark, with the botanical arch
 * sitting beneath it as the page's one large graphic. Wind crosses the whole
 * screen rather than only the arch — air that stopped at the edge of a box would
 * read as a decoration inside it, not as weather.
 */
export default function WelcomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const haptics = useHaptics();
  const { width, height } = useWindowDimensions();

  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const parsed = ProfileFormSchema.safeParse({ displayName: name });
    if (!parsed.success) {
      setError(t(parsed.error.issues[0]?.message ?? 'welcome.nameRequired'));
      haptics.warning();
      return;
    }

    setError(null);
    router.push({ pathname: '/create-pin', params: { name: parsed.data.displayName } });
  };

  return (
    <View style={styles.root}>
      <Screen scroll={false} style={styles.container}>
        <Block style={styles.hero}>
          <Reveal style={styles.lockup}>
            <View style={[styles.wallet, { backgroundColor: theme.tint }]}>
              <Ionicons name="wallet" size={24} color={theme.onTint} />
            </View>
            <ThemedText type="hero">Ledger</ThemedText>
          </Reveal>

          <Reveal delay={160}>
            <BotanicalMark width={128} />
          </Reveal>
        </Block>

        <Block style={styles.form}>
          <TextField
            label={t('welcome.yourName')}
            value={name}
            onChangeText={(value) => {
              setName(value);
              if (error) setError(null);
            }}
            autoFocus
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={submit}
            error={error}
            icon="person-outline"
            maxLength={40}
          />

          <Button title={t('common.continue')} icon="arrow-forward" onPress={submit} />
        </Block>
      </Screen>

      {/* Above the content, so the air passes over the mark and the form alike. */}
      <Wind width={width} height={height} streaks={PAGE_WIND} peakOpacity={0.22} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    justifyContent: 'space-between',
    gap: Spacing.four,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.five,
    paddingTop: Spacing.four,
  },
  lockup: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  wallet: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    gap: Spacing.four,
  },
});
