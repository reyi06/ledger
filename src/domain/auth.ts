import { z } from 'zod';

import { IdSchema, TimestampSchema } from './primitives';

/**
 * Offline authentication.
 *
 * There is no server and no network call anywhere in this flow. A profile is
 * stored on the device with a salted, stretched hash of the user's PIN. This
 * gates casual access to the app; it is deliberately *not* presented as
 * cryptographic protection of the underlying data, which lives unencrypted in
 * app-scoped storage.
 */

export const PIN_LENGTH = 6;

export const ProfileSchema = z.object({
  id: IdSchema,
  displayName: z.string().trim().min(1).max(40),
  /** Random per-profile value mixed into the PIN hash. */
  pinSalt: z.string().min(1),
  pinHash: z.string().min(1),
  /** Whether the device-level biometric prompt is offered on the lock screen. */
  biometricsEnabled: z.boolean().default(false),
  /** Consecutive failed unlock attempts, used to add friction over time. */
  failedAttempts: z.number().int().min(0).default(0),
  createdAt: TimestampSchema,
});
export type Profile = z.infer<typeof ProfileSchema>;

export const AuthSnapshotSchema = z.object({
  profile: ProfileSchema.nullable(),
});
export type AuthSnapshot = z.infer<typeof AuthSnapshotSchema>;

/** The lock state the UI reacts to. */
export const AUTH_STATUSES = ['loading', 'onboarding', 'locked', 'unlocked'] as const;
export type AuthStatus = (typeof AUTH_STATUSES)[number];

export const ProfileFormSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'welcome.nameRequired')
    .max(40, 'validation.max40'),
});
export type ProfileForm = z.infer<typeof ProfileFormSchema>;

export const PinFormSchema = z
  .string()
  .regex(/^\d+$/, 'Use numbers only')
  .length(PIN_LENGTH, `Use ${PIN_LENGTH} digits`);

/** Escalating cooldown so a 6-digit PIN is not trivially brute-forceable. */
export function lockoutSecondsFor(failedAttempts: number): number {
  if (failedAttempts < 5) return 0;
  return Math.min(300, 5 * 2 ** Math.min(failedAttempts - 5, 6));
}

export function describeAttemptsRemaining(failedAttempts: number): string | null {
  const remaining = 5 - failedAttempts;
  if (failedAttempts === 0 || remaining <= 0) return null;
  return remaining === 1 ? '1 attempt left' : `${remaining} attempts left`;
}
