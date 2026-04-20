import { describe, it, expect } from 'vitest';
import { mapManifestToSegments } from '../mapManifestToSegments';
import type { HistoryManifest } from '@/services/historyService/source/types';

const baseManifest: HistoryManifest = {
  version: 1,
  startUs: 1000,
  endUs: 31000,
  chunkDurationUs: 10000,
  chunkCount: 3,
};

describe('mapManifestToSegments', () => {
  it('returns one segment per chunk', () => {
    const segments = mapManifestToSegments(baseManifest);
    expect(segments).toHaveLength(3);
  });

  it('preserves fromUs and toUs for each chunk', () => {
    const segments = mapManifestToSegments(baseManifest);
    expect(segments[0]).toEqual({ fromUs: 1000, toUs: 11000 });
    expect(segments[1]).toEqual({ fromUs: 11000, toUs: 21000 });
    expect(segments[2]).toEqual({ fromUs: 21000, toUs: 31000 });
  });

  it('returns empty array when chunkCount is 0', () => {
    const manifest: HistoryManifest = { ...baseManifest, chunkCount: 0 };
    expect(mapManifestToSegments(manifest)).toEqual([]);
  });

  it('does not expose file, index, count or hasCheckpoint', () => {
    const segments = mapManifestToSegments(baseManifest);
    for (const segment of segments) {
      expect(Object.keys(segment)).toEqual(['fromUs', 'toUs']);
    }
  });
});
