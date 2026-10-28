import * as Crypto from 'expo-crypto';

/**
 * PIN hashing.
 *
 * `expo-crypto` exposes a real SHA-256 implementation backed by the platform,
 * so we use it with a per-profile random salt and a light stretching loop.
 * The loop count is intentionally modest: this runs on the JS thread behind a
 * lock screen, and the goal is to make an offline PIN guess expensive rather
 * than to be a KDF for long-lived secrets.
 */

const STRETCH_ITERATIONS = 150;

export function createSalt(): string {
  return Crypto.randomUUID().replace(/-/g, '');
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  let digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${pin}`,
  );

  for (let iteration = 0; iteration < STRETCH_ITERATIONS; iteration += 1) {
    digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${digest}:${salt}:${iteration}`,
    );
  }

  return digest;
}

/** Length-independent comparison that does not short-circuit on mismatch. */
export function constantTimeEquals(left: string, right: string): boolean {
  if (left.length !== right.length) return false;

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
}
