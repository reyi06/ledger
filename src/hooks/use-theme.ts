/**
 * Theme resolution.
 *
 * The user can pin a scheme or follow the system. Every component reads colors
 * through `useTheme()`, so a preference change re-renders the whole tree
 * consistently.
 */

import { Colors, type Theme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettingsStore } from '@/store/settings-store';

export type ResolvedScheme = 'light' | 'dark';

export function useResolvedScheme(): ResolvedScheme {
  const scheme = useColorScheme();
  const preference = useSettingsStore((state) => state.theme);

  if (preference === 'system') {
    return scheme === 'dark' ? 'dark' : 'light';
  }

  return preference;
}

export function useTheme(): Theme {
  return Colors[useResolvedScheme()];
}

export function useIsDark(): boolean {
  return useResolvedScheme() === 'dark';
}
