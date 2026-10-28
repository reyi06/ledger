import AsyncStorage from '@react-native-async-storage/async-storage';

/** Storage keys are versioned so a schema change can be rolled forward safely. */
export const LEDGER_STORAGE_KEY = 'ledger:state:v1';
export const AUTH_STORAGE_KEY = 'ledger:auth:v1';
export const SETTINGS_STORAGE_KEY = 'ledger:settings:v1';

/**
 * The narrow slice of AsyncStorage the app actually depends on. Tests and
 * previews can substitute an in-memory implementation.
 */
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export const keyValueStore: KeyValueStore = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

/** In-memory store, handy for tests and for previewing the app without device storage. */
export function createMemoryStore(initial: Record<string, string> = {}): KeyValueStore {
  const data = new Map(Object.entries(initial));
  return {
    async getItem(key) {
      return data.get(key) ?? null;
    },
    async setItem(key, value) {
      data.set(key, value);
    },
    async removeItem(key) {
      data.delete(key);
    },
  };
}
