import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { Account, Transaction } from '@/domain/models';
import { exportFileName, transactionsToCsv } from '@/lib/csv';

/**
 * CSV export.
 *
 * Writes the ledger to a cache file and hands it to the system share sheet.
 * Entirely offline: no upload, no network call.
 */

export interface ExportResult {
  fileName: string;
  uri: string;
}

export async function exportTransactionsCsv(
  transactions: readonly Transaction[],
  accounts: readonly Account[],
): Promise<ExportResult> {
  if (Platform.OS === 'web') {
    throw new Error('CSV export is available in the iOS and Android apps.');
  }

  if (transactions.length === 0) {
    throw new Error('There is nothing to export yet.');
  }

  const fileName = exportFileName();
  const csv = transactionsToCsv(transactions, accounts);

  const file = new File(Paths.cache, fileName);
  if (file.exists) {
    file.delete();
  }
  file.create();
  await file.write(csv);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error(`Saved to ${file.uri}, but sharing is unavailable on this device.`);
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export transactions',
    UTI: 'public.comma-separated-values-text',
  });

  return { fileName, uri: file.uri };
}
