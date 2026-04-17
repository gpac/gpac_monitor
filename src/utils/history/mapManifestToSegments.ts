import type { HistoryManifest } from '@/services/historyService/source/types';

export type TimeSegment = {
  fromUs: number;
  toUs: number;
};

export function mapManifestToSegments(
  manifest: HistoryManifest,
): TimeSegment[] {
  return manifest.eventChunks.map((chunk) => ({
    fromUs: chunk.fromUs,
    toUs: chunk.toUs,
  }));
}
