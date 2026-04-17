import { describe, it, expect } from 'vitest';
import { mapManifestToSegments } from '../mapManifestToSegments';
import type { HistoryManifest } from '@/services/historyService/source/types';

const baseManifest: HistoryManifest = {
  version: 1,
  startUs: 1000,
  endUs: 31000,
  eventChunks: [
    {
      file: 'chunk-0.jsonl',
      fromUs: 1000,
      toUs: 11000,
      count: 10,
      index: 0,
      hasCheckpoint: false,
    },
    {
      file: 'chunk-1.jsonl',
      fromUs: 11000,
      toUs: 21000,
      count: 8,
      index: 1,
      hasCheckpoint: true,
    },
    {
      file: 'chunk-2.jsonl',
      fromUs: 21000,
      toUs: 31000,
      count: 12,
      index: 2,
      hasCheckpoint: false,
    },
  ],
};

describe('mapManifestToSegments', () => {
  it('returns one segment per eventChunk', () => {
    const segments = mapManifestToSegments(baseManifest);
    expect(segments).toHaveLength(3);
  });

  it('preserves fromUs and toUs for each chunk', () => {
    const segments = mapManifestToSegments(baseManifest);
    expect(segments[0]).toEqual({ fromUs: 1000, toUs: 11000 });
    expect(segments[1]).toEqual({ fromUs: 11000, toUs: 21000 });
    expect(segments[2]).toEqual({ fromUs: 21000, toUs: 31000 });
  });

  it('returns empty array when eventChunks is empty', () => {
    const manifest: HistoryManifest = { ...baseManifest, eventChunks: [] };
    expect(mapManifestToSegments(manifest)).toEqual([]);
  });

  it('does not expose file, index, count or hasCheckpoint', () => {
    const segments = mapManifestToSegments(baseManifest);
    for (const segment of segments) {
      expect(Object.keys(segment)).toEqual(['fromUs', 'toUs']);
    }
  });
});
