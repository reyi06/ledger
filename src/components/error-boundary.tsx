import { type ErrorBoundaryProps } from 'expo-router';
import { StyleSheet, useColorScheme, View } from 'react-native';

import { Colors, Line, Radius, Spacing } from '@/constants/theme';
import { useTranslation } from '@/hooks/use-translation';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/controls';
import { Rule } from '@/components/ui/surface';

/**
 * Root error boundary.
 *
 * Deliberately lives outside `src/app/`: every file in the app directory is a
 * route and must have a default export, so a named-export component there breaks
 * the router. It is re-exported from `src/app/_layout.tsx`, which is what Expo
 * Router looks for.
 *
 * It avoids anything needing a provider above it — no safe-area context, no router
 * hooks beyond the supplied `retry` — because it renders in place of the whole
 * tree when a render throws. Colours come from `useColorScheme` rather than the
 * settings store, which may not have hydrated when a crash happens during boot.
 *
 * The translation hook is the one exception, and it is safe: the language lives in
 * a module-level Zustand store that needs no provider and already holds its default
 * before hydration, so reading it here cannot itself throw.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { t } = useTranslation();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Rule weight={Line.hairline} style={styles.rule} />

      <ThemedText type="label" themeColor="textTertiary">
        {t('error.title')}
      </ThemedText>
      <ThemedText type="title">Ledger</ThemedText>
      <ThemedText type="body" themeColor="textSecondary">
        {t('error.body')}
      </ThemedText>

      <View
        style={[
          styles.detail,
          { borderColor: colors.borderLight, backgroundColor: colors.surfaceAlt },
        ]}>
        <ThemedText type="code" themeColor="textTertiary">
          {error.message}
        </ThemedText>
      </View>

      <Button title={t('error.reload')} onPress={retry} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  rule: {
    width: 48,
    marginBottom: Spacing.two,
  },
  detail: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
});
