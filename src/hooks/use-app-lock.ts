import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useAuthStore } from '@/store/auth-store';
import { useSettingsStore } from '@/store/settings-store';

/**
 * Re-locks the app after it has been in the background for longer than the
 * configured grace period. A quick app switch does not lock, which keeps the
 * flowy feel without leaving the ledger open indefinitely.
 */
export function useAppLock(): void {
  const autoLockMinutes = useSettingsStore((state) => state.autoLockMinutes);
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    if (autoLockMinutes === 0) return undefined;

    const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
      if (status === 'active') {
        const since = backgroundedAt.current;
        backgroundedAt.current = null;

        if (since !== null && Date.now() - since >= autoLockMinutes * 60_000) {
          useAuthStore.getState().lock();
        }
        return;
      }

      if (backgroundedAt.current === null) {
        backgroundedAt.current = Date.now();
      }
    });

    return () => subscription.remove();
  }, [autoLockMinutes]);
}
