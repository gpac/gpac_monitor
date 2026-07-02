import type { JournalIndexPointer } from './source/types';
import type { JournalIndex } from './types';

/** Validates the small `journalIndex` pointer embedded in manifest.json. */
export function parseJournalIndexPointer(
  data: Record<string, unknown>,
): JournalIndexPointer | undefined {
  const raw = data['journalIndex'];
  if (!raw || typeof raw !== 'object') return undefined;
  const pointer = raw as Record<string, unknown>;
  if (
    typeof pointer['file'] !== 'string' ||
    typeof pointer['format'] !== 'string' ||
    typeof pointer['eventCount'] !== 'number' ||
    typeof pointer['errorCount'] !== 'number' ||
    typeof pointer['warningCount'] !== 'number'
  ) {
    return undefined;
  }
  return {
    file: pointer['file'],
    format: pointer['format'],
    eventCount: pointer['eventCount'],
    errorCount: pointer['errorCount'],
    warningCount: pointer['warningCount'],
  };
}

/** Parses journal_index.json's columnar content, decoded lazily by the caller. */
export function parseJournalIndex(raw: unknown): JournalIndex | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  const isNumberArray = (value: unknown): value is number[] =>
    Array.isArray(value) && value.every((item) => typeof item === 'number');

  if (
    typeof data['baseTsUs'] !== 'number' ||
    !isNumberArray(data['tsDeltaUs']) ||
    !isNumberArray(data['types']) ||
    !isNumberArray(data['levels']) ||
    !isNumberArray(data['chunkIndexes']) ||
    !isNumberArray(data['batchTsUs']) ||
    !isNumberArray(data['indexInBatch'])
  ) {
    return null;
  }

  return {
    baseTsUs: data['baseTsUs'],
    tsDeltaUs: data['tsDeltaUs'],
    types: data['types'],
    levels: data['levels'],
    chunkIndexes: data['chunkIndexes'],
    batchTsUs: data['batchTsUs'],
    indexInBatch: data['indexInBatch'],
  };
}
