import { z } from 'zod';

import { CurrencySchema } from './money';

/**
 * User preferences. These are stored alongside the ledger but are kept in a
 * separate schema so a preferences change can never invalidate financial data.
 */

export const ThemePreferences = ['system', 'light', 'dark'] as const;
export const ThemePreferenceSchema = z.enum(ThemePreferences);
export type ThemePreference = z.infer<typeof ThemePreferenceSchema>;

export const THEME_PREFERENCE_LABELS: Record<ThemePreference, string> = {
  system: 'theme.system',
  light: 'theme.light',
  dark: 'theme.dark',
};

/**
 * Interface language. Kept in the domain rather than in the i18n module because
 * it is a persisted preference like any other, and the dictionary should not own
 * the schema that storage validates against.
 */
export const LanguageCodes = ['en', 'fil'] as const;
export const LanguageSchema = z.enum(LanguageCodes);
export type Language = z.infer<typeof LanguageSchema>;

/** Endonyms: a language is always offered in its own words. */
export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  fil: 'Filipino',
};

export const SettingsSchema = z.object({
  theme: ThemePreferenceSchema.default('system'),
  currency: CurrencySchema.default('USD'),
  hapticsEnabled: z.boolean().default(true),
  /** Requires the PIN again after the app has been backgrounded this long. */
  autoLockMinutes: z.number().int().min(0).max(120).default(1),
  /** Masks every balance behind a tap-to-reveal placeholder. */
  hideBalances: z.boolean().default(false),
  /**
   * Whether the guided tour has been completed. Defaulted rather than required
   * so a payload written before the tour existed still parses.
   */
  hasSeenTour: z.boolean().default(false),
  language: LanguageSchema.default('en'),
});
export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: Settings = SettingsSchema.parse({});

export const AUTO_LOCK_OPTIONS = [0, 1, 5, 15, 60] as const;
export type AutoLockMinutes = (typeof AUTO_LOCK_OPTIONS)[number];

export function autoLockKey(minutes: number): { key: string; params?: { minutes: number } } {
  if (minutes === 0) return { key: 'autolock.never' };
  if (minutes === 1) return { key: 'autolock.oneMinute' };
  if (minutes < 60) return { key: 'autolock.minutes', params: { minutes } };
  return { key: 'autolock.oneHour' };
}
