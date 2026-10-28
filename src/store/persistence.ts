import { ledgerRepository, type LedgerRepository } from '@/data/repositories';
import { snapshotOfLedger, useLedgerStore } from './ledger-store';

/**
 * Autosave.
 *
 * The store stays synchronous and free of I/O; this module subscribes to it and
 * writes the persistable slice to device storage after a short debounce. It
 * compares the mutable slices by reference, which is cheap because every action
 * replaces arrays instead of mutating them.
 */

const DEBOUNCE_MS = 300;

export function startLedgerPersistence(
  repository: LedgerRepository = ledgerRepository,
): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let dirty = false;

  const flush = () => {
    timer = null;
    dirty = false;
    void repository.save(snapshotOfLedger(useLedgerStore.getState()));
  };

  const unsubscribe = useLedgerStore.subscribe((state, previous) => {
    if (!state.hydrated) return;

    const changed =
      state.accounts !== previous.accounts ||
      state.transactions !== previous.transactions ||
      state.budgets !== previous.budgets ||
      state.recurring !== previous.recurring;

    if (!changed) return;

    dirty = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, DEBOUNCE_MS);
  });

  return () => {
    unsubscribe();
    if (timer) {
      clearTimeout(timer);
      if (dirty) flush();
    }
  };
}
