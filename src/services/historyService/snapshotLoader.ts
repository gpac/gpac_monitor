import type { HistorySnapshot } from './types';

export class SnapshotLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotLoadError';
  }
}

export function loadSnapshotFile(file: File): Promise<HistorySnapshot> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        if (typeof data.version !== 'number' || !Array.isArray(data.filters)) {
          throw new SnapshotLoadError('Invalid snapshot format');
        }
        resolve(data as HistorySnapshot);
      } catch (err) {
        reject(err instanceof SnapshotLoadError ? err : new SnapshotLoadError('Failed to parse snapshot.json'));
      }
    };

    reader.onerror = () => reject(new SnapshotLoadError('Failed to read file'));
    reader.readAsText(file);
  });
}
