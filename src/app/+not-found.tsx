import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Line, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/controls';
import { Rule } from '@/components/ui/surface';

/**
 * Unmatched route.
 *
 * Reached by a deep link to a path this build does not know — a stale link, a
 * typo, or a route removed in a later release. Without it the router renders a
 * bare development message, which is not something to ship.
 */
export default function NotFoundScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Rule weight={Line.hairline} style={styles.rule} />

      <ThemedText type="label" themeColor="textTertiary">
        {t('error.code')}
      </ThemedText>
      <ThemedText type="title">{t('error.notFoundTitle')}</ThemedText>
      <ThemedText type="body" themeColor="textSecondary">
        {t('error.notFoundBody')}
      </ThemedText>

      <Button title={t('error.goHome')} onPress={() => router.replace('/')} />
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
});
