import { useMemo } from 'react';

import { translate, type TranslationParams } from '@/i18n';
import { useSettingsStore } from '@/store/settings-store';

/**
 * The translation hook.
 *
 * Reads the language from settings and returns a `t` bound to it. Screens call
 * `t('budgets.envelopes')`; nothing else in the app needs to know which language
 * is active, and changing the preference re-renders every subscriber because the
 * language lives in the settings store rather than in a provider.
 */
export function useTranslation() {
  const language = useSettingsStore((state) => state.language);

  return useMemo(
    () => ({
      language,
      t: (key: string, params?: TranslationParams) => translate(language, key, params),
    }),
    [language],
  );
}
