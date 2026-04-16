import type {
  HistoryManifest,
  HistoryManifestEventChunk,
  HistoryManifestCheckpoint,
  HistoryManifestChunk,
} from './source/types';

function assertEventChunk(
  chunk: unknown,
  position: number,
): asserts chunk is Record<string, unknown> {
  if (!chunk || typeof chunk !== 'object') {
    throw new Error(
      `[ManifestParser] eventChunks[${position}] must be an object`,
    );
  }
  const chk = chunk as Record<string, unknown>;
  if (typeof chk['file'] !== 'string') {
    throw new Error(
      `[ManifestParser] eventChunks[${position}].file must be a string`,
    );
  }
  if (typeof chk['fromUs'] !== 'number') {
    throw new Error(
      `[ManifestParser] eventChunks[${position}].fromUs must be a number`,
    );
  }
  if (typeof chk['toUs'] !== 'number') {
    throw new Error(
      `[ManifestParser] eventChunks[${position}].toUs must be a number`,
    );
  }
  if ((chk['fromUs'] as number) >= (chk['toUs'] as number)) {
    throw new Error(
      `[ManifestParser] eventChunks[${position}]: fromUs must be < toUs`,
    );
  }
}

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

  const rawChunks = data['eventChunks'] ?? data['chunks'];
  if (!Array.isArray(rawChunks) || rawChunks.length === 0) {
    throw new Error('[ManifestParser] eventChunks must be a non-empty array');
  }

  const eventChunks: HistoryManifestEventChunk[] = rawChunks.map((chunk, i) => {
    assertEventChunk(chunk, i);
    return {
      file: chunk['file'] as string,
      fromUs: chunk['fromUs'] as number,
      toUs: chunk['toUs'] as number,
      count: typeof chunk['count'] === 'number' ? chunk['count'] : 0,
      index: i,
      hasCheckpoint: chunk['hasCheckpoint'] === true,
    };
  });

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
        (checkpoint): checkpoint is HistoryManifestCheckpoint => {
          if (!checkpoint || typeof checkpoint !== 'object') return false;
          const chk = checkpoint as Record<string, unknown>;
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
    eventChunks,
    logChunks,
    checkpoints,
  };
}

export function getDuration(manifest: HistoryManifest): number {
  return manifest.endUs - manifest.startUs;
}

export function findEventChunkIndex(
  manifest: HistoryManifest,
  tsUs: number,
): number {
  const chunks = manifest.eventChunks;
  if (chunks.length === 0) throw new Error('[ManifestParser] no event chunks');

  for (let i = 0; i < chunks.length; i++) {
    if (tsUs >= chunks[i].fromUs && tsUs < chunks[i].toUs) return i;
  }

  return chunks.length - 1;
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
