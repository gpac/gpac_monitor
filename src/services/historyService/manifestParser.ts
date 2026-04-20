import type {
  HistoryManifest,
  HistoryManifestCheckpoint,
  HistoryManifestChunk,
} from './source/types';

export function parseManifest(raw: unknown): HistoryManifest {
  if (!raw || typeof raw !== 'object') {
    throw new Error('[ManifestParser] manifest must be an object');
  }
  const data = raw as Record<string, unknown>;

  if (data['version'] !== 1) {
    throw new Error(`[ManifestParser] unsupported version: ${data['version']}`);
  }
  if (typeof data['startUs'] !== 'number') {
    throw new Error('[ManifestParser] startUs must be a number');
  }
  if (typeof data['endUs'] !== 'number') {
    throw new Error('[ManifestParser] endUs must be a number');
  }
  if (
    typeof data['chunkDurationUs'] !== 'number' ||
    data['chunkDurationUs'] <= 0
  ) {
    throw new Error(
      '[ManifestParser] chunkDurationUs must be a positive number',
    );
  }
  if (typeof data['chunkCount'] !== 'number' || data['chunkCount'] <= 0) {
    throw new Error('[ManifestParser] chunkCount must be a positive number');
  }

  const logChunks: HistoryManifestChunk[] = Array.isArray(data['logChunks'])
    ? (data['logChunks'] as unknown[]).filter(
        (chunk): chunk is HistoryManifestChunk => {
          if (!chunk || typeof chunk !== 'object') return false;
          const chk = chunk as Record<string, unknown>;
          return (
            typeof chk['file'] === 'string' &&
            typeof chk['fromUs'] === 'number' &&
            typeof chk['toUs'] === 'number' &&
            (chk['fromUs'] as number) < (chk['toUs'] as number)
          );
        },
      )
    : [];

  const checkpoints: HistoryManifestCheckpoint[] = Array.isArray(
    data['checkpoints'],
  )
    ? (data['checkpoints'] as unknown[]).filter(
        (cp): cp is HistoryManifestCheckpoint => {
          if (!cp || typeof cp !== 'object') return false;
          const chk = cp as Record<string, unknown>;
          return (
            typeof chk['chunkIndex'] === 'number' &&
            typeof chk['file'] === 'string'
          );
        },
      )
    : [];

  return {
    version: 1,
    startUs: data['startUs'] as number,
    endUs: data['endUs'] as number,
    chunkDurationUs: data['chunkDurationUs'] as number,
    chunkCount: data['chunkCount'] as number,
    logChunks,
    checkpoints,
  };
}

export function getDuration(manifest: HistoryManifest): number {
  return manifest.endUs - manifest.startUs;
}

/** Returns the chunk index for a given timestamp. */
export function findEventChunkIndex(
  manifest: HistoryManifest,
  tsUs: number,
): number {
  const index = Math.floor(
    (tsUs - manifest.startUs) / manifest.chunkDurationUs,
  );
  return Math.max(0, Math.min(index, manifest.chunkCount - 1));
}

export function getChunkFile(index: number): string {
  return `chunks/chunk_${String(index).padStart(4, '0')}.jsonl`;
}

/** Returns the [fromUs, toUs] range for a given chunk index. */
export function getEventChunkRange(
  manifest: HistoryManifest,
  index: number,
): { fromUs: number; toUs: number } {
  const fromUs = manifest.startUs + index * manifest.chunkDurationUs;
  const toUs = Math.min(fromUs + manifest.chunkDurationUs, manifest.endUs);
  return { fromUs, toUs };
}

/** Returns all logChunks whose [fromUs, toUs] intersects the given range. */
export function findLogChunksInRange(
  manifest: HistoryManifest,
  fromUs: number,
  toUs: number,
): HistoryManifestChunk[] {
  return (manifest.logChunks ?? []).filter(
    (chunk) => chunk.fromUs < toUs && chunk.toUs > fromUs,
  );
}

/** Returns the most recent checkpoint with chunkIndex <= position, or null. */
export function findNearestCheckpoint(
  manifest: HistoryManifest,
  position: number,
): HistoryManifestCheckpoint | null {
  let nearest: HistoryManifestCheckpoint | null = null;

  for (const checkpoint of manifest.checkpoints ?? []) {
    if (checkpoint.chunkIndex <= position) {
      if (nearest === null || checkpoint.chunkIndex > nearest.chunkIndex) {
        nearest = checkpoint;
      }
    }
  }

  return nearest;
}
