import type { HistoryManifest } from '@/services/historyService/source/types';
import { getEventChunkRange } from '@/services/historyService/manifestParser';

export type TimeSegment = {
  fromUs: number;
  toUs: number;
};

export function mapManifestToSegments(
  manifest: HistoryManifest,
): TimeSegment[] {
  return Array.from({ length: manifest.chunkCount }, (_, index) =>
    getEventChunkRange(manifest, index),
  );
}
