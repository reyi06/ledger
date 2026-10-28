import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { authRepository, type AuthRepository } from '@/data/repositories';
import { lockoutSecondsFor, type AuthStatus, type Profile } from '@/domain/auth';
import { constantTimeEquals, createSalt, hashPin } from '@/lib/hash';
import { createId, nowTimestamp } from '@/lib/id';

/**
 * Offline authentication state machine.
 *
 * `loading` -> `onboarding` (no profile yet) | `locked` (profile exists)
 * `locked` -> `unlocked` on a correct PIN or a successful biometric prompt.
 *
 * Nothing here touches the network. The PIN never leaves the device; only a
 * salted, stretched hash is stored.
 */

interface BiometricSupport {
  available: boolean;
  label: string;
}

interface AuthState {
  status: AuthStatus;
  profile: Profile | null;
  biometrics: BiometricSupport;
  lockedUntil: number | null;
  lastError: string | null;
  busy: boolean;

  hydrate(repository?: AuthRepository): Promise<void>;
  createProfile(displayName: string, pin: string): Promise<void>;
  unlock(pin: string): Promise<boolean>;
  unlockWithBiometrics(): Promise<boolean>;
  lock(): void;
  setBiometricsEnabled(enabled: boolean): Promise<boolean>;
  changePin(currentPin: string, nextPin: string): Promise<boolean>;
  signOut(): Promise<void>;
  clearError(): void;
}

async function detectBiometrics(): Promise<BiometricSupport> {
  try {
    const [hasHardware, enrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);

    const facial = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
    const label = facial
      ? Platform.OS === 'ios'
        ? 'Face ID'
        : 'Face unlock'
      : Platform.OS === 'ios'
        ? 'Touch ID'
        : 'Fingerprint';

    return { available: hasHardware && enrolled, label };
  } catch {
    return { available: false, label: 'Biometrics' };
  }
}

function secondsUntil(timestamp: number | null): number {
  if (!timestamp) return 0;
  return Math.max(0, Math.ceil((timestamp - Date.now()) / 1000));
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  status: 'loading',
  profile: null,
  biometrics: { available: false, label: 'Biometrics' },
  lockedUntil: null,
  lastError: null,
  busy: false,

  async hydrate(repository: AuthRepository = authRepository) {
    const [stored, biometrics] = await Promise.all([repository.load(), detectBiometrics()]);
    const profile = stored?.profile ?? null;

    set({
      profile,
      biometrics,
      status: profile ? 'locked' : 'onboarding',
      lockedUntil: null,
      lastError: null,
    });
  },

  async createProfile(displayName, pin) {
    set({ busy: true, lastError: null });

    try {
      const pinSalt = createSalt();
      const pinHash = await hashPin(pin, pinSalt);

      const profile: Profile = {
        id: createId('user'),
        displayName: displayName.trim(),
        pinSalt,
        pinHash,
        biometricsEnabled: false,
        failedAttempts: 0,
        createdAt: nowTimestamp(),
      };

      await authRepository.save({ profile });
      set({ profile, status: 'unlocked', busy: false, lockedUntil: null });
    } catch (error) {
      console.warn('[ledger] could not create profile', error);
      set({ busy: false, lastError: 'Could not save your profile' });
    }
  },

  async unlock(pin) {
    const profile = get().profile;
    if (!profile) {
      set({ status: 'onboarding' });
      return false;
    }

    if (secondsUntil(get().lockedUntil) > 0) {
      set({ lastError: `Too many attempts. Try again in ${secondsUntil(get().lockedUntil)}s.` });
      return false;
    }

    set({ busy: true, lastError: null });
    const candidate = await hashPin(pin, profile.pinSalt);

    if (constantTimeEquals(candidate, profile.pinHash)) {
      const cleared: Profile = { ...profile, failedAttempts: 0 };
      await authRepository.save({ profile: cleared });
      set({ profile: cleared, status: 'unlocked', busy: false, lockedUntil: null });
      return true;
    }

    const failedAttempts = profile.failedAttempts + 1;
    const next: Profile = { ...profile, failedAttempts };
    await authRepository.save({ profile: next });

    const cooldown = lockoutSecondsFor(failedAttempts);
    set({
      profile: next,
      busy: false,
      lockedUntil: cooldown > 0 ? Date.now() + cooldown * 1000 : null,
      lastError: cooldown > 0 ? `Too many attempts. Wait ${cooldown}s.` : 'Incorrect PIN',
    });
    return false;
  },

  async unlockWithBiometrics() {
    const profile = get().profile;
    if (!profile?.biometricsEnabled) return false;

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Ledger',
        cancelLabel: 'Use PIN',
        disableDeviceFallback: true,
      });

      if (result.success) {
        set({ status: 'unlocked', lastError: null, lockedUntil: null });
        return true;
      }

      const cancelled = result.error === 'user_cancel' || result.error === 'system_cancel';
      set({ lastError: cancelled ? null : 'Biometric unlock failed' });
      return false;
    } catch {
      set({ lastError: 'Biometric unlock unavailable' });
      return false;
    }
  },

  lock() {
    if (!get().profile) return;
    set({ status: 'locked', lastError: null });
  },

  async setBiometricsEnabled(enabled) {
    const profile = get().profile;
    if (!profile) return false;

    if (enabled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm to enable biometric unlock',
        cancelLabel: 'Cancel',
        disableDeviceFallback: true,
      });
      if (!result.success) {
        set({ lastError: null });
        return false;
      }
    }

    const next: Profile = { ...profile, biometricsEnabled: enabled };
    await authRepository.save({ profile: next });
    set({ profile: next });
    return true;
  },

  async changePin(currentPin, nextPin) {
    const profile = get().profile;
    if (!profile) return false;

    const candidate = await hashPin(currentPin, profile.pinSalt);
    if (!constantTimeEquals(candidate, profile.pinHash)) {
      set({ lastError: 'Current PIN is incorrect' });
      return false;
    }

    const pinSalt = createSalt();
    const pinHash = await hashPin(nextPin, pinSalt);
    const next: Profile = { ...profile, pinSalt, pinHash, failedAttempts: 0 };
    await authRepository.save({ profile: next });
    set({ profile: next, lastError: null });
    return true;
  },

  async signOut() {
    await authRepository.clear();
    set({
      profile: null,
      status: 'onboarding',
      lockedUntil: null,
      lastError: null,
    });
  },

  clearError() {
    set({ lastError: null });
  },
}));
