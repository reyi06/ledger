import { PersistedLedgerSchema, type PersistedLedger } from '@/domain/models';
import { AuthSnapshotSchema, type AuthSnapshot } from '@/domain/auth';
import { SettingsSchema, type Settings } from '@/domain/settings';
import { createJsonRepository, type JsonRepository } from './json-repository';
import { AUTH_STORAGE_KEY, LEDGER_STORAGE_KEY, SETTINGS_STORAGE_KEY } from './storage';

export type LedgerRepository = JsonRepository<PersistedLedger>;
export type AuthRepository = JsonRepository<AuthSnapshot>;
export type SettingsRepository = JsonRepository<Settings>;

export const ledgerRepository: LedgerRepository = createJsonRepository(
  LEDGER_STORAGE_KEY,
  PersistedLedgerSchema,
);

export const authRepository: AuthRepository = createJsonRepository(
  AUTH_STORAGE_KEY,
  AuthSnapshotSchema,
);

export const settingsRepository: SettingsRepository = createJsonRepository(
  SETTINGS_STORAGE_KEY,
  SettingsSchema,
);
