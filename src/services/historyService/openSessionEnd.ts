import type { HistoryManifest, HistorySource } from './source/types';

/** Real end of a session killed before close(): last complete event of the unlisted open chunk. */
export async function readOpenSessionEndUs(
  source: HistorySource,
  segmentDir: string,
  manifest: HistoryManifest | null,
): Promise<number | undefined> {
  if (!manifest) return undefined;
  const listedChunkCount = manifest.eventChunks?.length ?? manifest.chunkCount;
  if (manifest.chunkCount <= listedChunkCount) return manifest.endUs;
  try {
    const events = await source.readChunk(manifest.chunkCount - 1, segmentDir);
    return events.reduce(
      (endUs, event) => Math.max(endUs, event.ts_us),
      manifest.endUs,
    );
  } catch (error) {
    console.warn('[openSessionEnd] Open chunk unreadable, keeping manifest end', error);
    return manifest.endUs;
  }
}
