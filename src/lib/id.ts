import * as Crypto from 'expo-crypto';

/**
 * Identifier factory. Prefers the platform CSPRNG and falls back to a
 * timestamp/random composite so tests and older runtimes still work.
 */
export function createId(prefix?: string): string {
  const raw =
    typeof Crypto.randomUUID === 'function'
      ? Crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

  return prefix ? `${prefix}_${raw}` : raw;
}

export function nowTimestamp(): string {
  return new Date().toISOString();
}
