import { create } from 'zustand';

import { DEFAULT_SETTINGS, type Language, type Settings, type ThemePreference } from '@/domain/settings';
import type { CurrencyCode } from '@/domain/money';
import { settingsRepository, type SettingsRepository } from '@/data/repositories';

interface SettingsState extends Settings {
  hydrated: boolean;
  hydrate(repository?: SettingsRepository): Promise<void>;
  setTheme(theme: ThemePreference): void;
  setCurrency(currency: CurrencyCode): void;
  setHapticsEnabled(enabled: boolean): void;
  setAutoLockMinutes(minutes: number): void;
  setHideBalances(hidden: boolean): void;
  setHasSeenTour(seen: boolean): void;
  setLanguage(language: Language): void;
}

/**
 * Preferences live in their own store, so changing the theme never touches the
 * ledger document and vice versa.
 */
export const useSettingsStore = create<SettingsState>()((set, get) => {
  const persist = () => {
    void settingsRepository.save(snapshot(get()));
  };

  return {
    ...DEFAULT_SETTINGS,
    hydrated: false,

    async hydrate(repository: SettingsRepository = settingsRepository) {
      const stored = await repository.load();
      set({ ...(stored ?? DEFAULT_SETTINGS), hydrated: true });
    },

    setTheme(theme) {
      set({ theme });
      persist();
    },

    setCurrency(currency) {
      set({ currency });
      persist();
    },

    setHapticsEnabled(hapticsEnabled) {
      set({ hapticsEnabled });
      persist();
    },

    setAutoLockMinutes(autoLockMinutes) {
      set({ autoLockMinutes });
      persist();
    },

    setHideBalances(hideBalances) {
      set({ hideBalances });
      persist();
    },

    setHasSeenTour(hasSeenTour) {
      set({ hasSeenTour });
      persist();
    },

    setLanguage(language) {
      set({ language });
      persist();
    },
  };
});

export function snapshot(state: SettingsState): Settings {
  return {
    theme: state.theme,
    currency: state.currency,
    hapticsEnabled: state.hapticsEnabled,
    autoLockMinutes: state.autoLockMinutes,
    hideBalances: state.hideBalances,
    hasSeenTour: state.hasSeenTour,
    language: state.language,
  };
}
