import { keyValueStore, type KeyValueStore } from './storage';

/**
 * A tiny persistence helper shared by every stored document.
 *
 * The repository validates on the way *in* as well as on the way *out*: a
 * payload that no longer matches the schema is discarded rather than handed to
 * the UI, which is what stops a stale build from rendering `NaN` balances.
 */

/**
 * Structural subset of a Zod schema. Using a structural type keeps this module
 * independent of a specific Zod major version.
 */
export interface Validator<T> {
  safeParse(
    value: unknown,
  ): { success: true; data: T } | { success: false; error: { message: string } };
}

export interface JsonRepository<T> {
  load(): Promise<T | null>;
  save(value: T): Promise<void>;
  clear(): Promise<void>;
}

export function createJsonRepository<T>(
  key: string,
  validator: Validator<T>,
  store: KeyValueStore = keyValueStore,
): JsonRepository<T> {
  return {
    async load(): Promise<T | null> {
      let raw: string | null = null;

      try {
        raw = await store.getItem(key);
      } catch (error) {
        console.warn(`[ledger] could not read "${key}"`, error);
        return null;
      }

      if (raw === null) return null;

      let decoded: unknown;
      try {
        decoded = JSON.parse(raw);
      } catch (error) {
        console.warn(`[ledger] "${key}" held invalid JSON, discarding`, error);
        await store.removeItem(key);
        return null;
      }

      const parsed = validator.safeParse(decoded);
      if (!parsed.success) {
        console.warn(`[ledger] "${key}" failed validation, discarding`, parsed.error.message);
        await store.removeItem(key);
        return null;
      }

      return parsed.data;
    },

    async save(value: T): Promise<void> {
      const parsed = validator.safeParse(value);
      if (!parsed.success) {
        console.warn(`[ledger] refused to persist invalid "${key}"`, parsed.error.message);
        return;
      }
      await store.setItem(key, JSON.stringify(parsed.data));
    },

    async clear(): Promise<void> {
      await store.removeItem(key);
    },
  };
}
