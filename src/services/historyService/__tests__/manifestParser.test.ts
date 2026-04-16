import { describe, it, expect } from 'vitest';
import {
  parseManifest,
  getDuration,
  findEventChunkIndex,
  findLogChunksInRange,
  findNearestCheckpoint,
} from '../manifestParser';
import type { HistoryManifest } from '../source/types';

const manifest: HistoryManifest = {
  version: 1,
  startUs: 0,
  endUs: 30_000_000,
  eventChunks: [
    {
      index: 0,
      fromUs: 0,
      toUs: 10_000_000,
      file: 'chunks/chunk_0000.jsonl',
      count: 100,
      hasCheckpoint: false,
    },
    {
      index: 1,
      fromUs: 10_000_000,
      toUs: 20_000_000,
      file: 'chunks/chunk_0001.jsonl',
      count: 150,
      hasCheckpoint: true,
    },
    {
      index: 2,
      fromUs: 20_000_000,
      toUs: 30_000_000,
      file: 'chunks/chunk_0002.jsonl',
      count: 80,
      hasCheckpoint: false,
    },
  ],
  logChunks: [
    { fromUs: 0, toUs: 5_000_000, file: 'logs/logs_0000.jsonl', count: 50 },
    {
      fromUs: 4_000_000,
      toUs: 9_000_000,
      file: 'logs/logs_0001.jsonl',
      count: 200,
    },
    {
      fromUs: 15_000_000,
      toUs: 25_000_000,
      file: 'logs/logs_0002.jsonl',
      count: 300,
    },
  ],
  checkpoints: [{ chunkIndex: 1, file: 'checkpoints/cp_0001.json' }],
};

// --- getDuration ---

describe('getDuration', () => {
  it('returns endUs - startUs', () => {
    expect(getDuration(manifest)).toBe(30_000_000);
  });
});

// --- findEventChunkIndex ---

describe('findEventChunkIndex', () => {
  it.each([
    [0, 0],
    [5_000_000, 0],
    [9_999_999, 0],
    [10_000_000, 1],
    [19_999_999, 1],
    [20_000_000, 2],
    [35_000_000, 2], // après la fin → dernier chunk
  ])('ts=%i → position %i', (tsUs, expected) => {
    expect(findEventChunkIndex(manifest, tsUs)).toBe(expected);
  });

  it('throws if eventChunks is empty', () => {
    expect(() =>
      findEventChunkIndex({ ...manifest, eventChunks: [] }, 0),
    ).toThrow();
  });
});

// --- findLogChunksInRange ---

describe('findLogChunksInRange', () => {
  it('returns chunks intersecting the range', () => {
    // logs_0000 [0,5M) et logs_0001 [4M,9M) intersectent [0,5M)
    expect(findLogChunksInRange(manifest, 0, 5_000_000)).toHaveLength(2);
  });

  it('returns empty when no log covers the range', () => {
    expect(findLogChunksInRange(manifest, 10_000_000, 14_000_000)).toHaveLength(
      0,
    );
  });

  it('returns [] when logChunks is undefined', () => {
    expect(
      findLogChunksInRange(
        { ...manifest, logChunks: undefined },
        0,
        30_000_000,
      ),
    ).toEqual([]);
  });

  it('handles multiple chunks covering the same time range', () => {
    // logs_0000 et logs_0001 couvrent tous deux [4.5M, 5.5M)
    expect(findLogChunksInRange(manifest, 4_500_000, 5_500_000)).toHaveLength(
      2,
    );
  });
});

// --- findNearestCheckpoint ---

describe('findNearestCheckpoint', () => {
  it('returns null if no checkpoint exists at or before position', () => {
    expect(findNearestCheckpoint(manifest, 0)).toBeNull();
  });

  it('returns checkpoint at exact position', () => {
    expect(findNearestCheckpoint(manifest, 1)?.chunkIndex).toBe(1);
  });

  it('returns the nearest checkpoint before position', () => {
    expect(findNearestCheckpoint(manifest, 2)?.chunkIndex).toBe(1);
  });

  it('returns null when checkpoints is empty', () => {
    expect(
      findNearestCheckpoint({ ...manifest, checkpoints: [] }, 5),
    ).toBeNull();
  });
});

// --- parseManifest ---

describe('parseManifest', () => {
  it('parses a valid V7 manifest', () => {
    const raw = {
      version: 1,
      startUs: 0,
      endUs: 10_000_000,
      eventChunks: [
        {
          fromUs: 0,
          toUs: 10_000_000,
          file: 'chunks/chunk_0000.jsonl',
          count: 10,
        },
      ],
    };
    const parsed = parseManifest(raw);
    expect(parsed.eventChunks[0].index).toBe(0);
    expect(parsed.logChunks).toEqual([]);
    expect(parsed.checkpoints).toEqual([]);
  });

  it('converts old "chunks" format — index = position', () => {
    const raw = {
      version: 1,
      startUs: 0,
      endUs: 10_000_000,
      chunks: [
        {
          fromUs: 0,
          toUs: 5_000_000,
          file: 'chunks/chunk_0000.jsonl',
          count: 5,
        },
        {
          fromUs: 5_000_000,
          toUs: 10_000_000,
          file: 'chunks/chunk_0001.jsonl',
          count: 5,
        },
      ],
    };
    const parsed = parseManifest(raw);
    expect(parsed.eventChunks[0].index).toBe(0);
    expect(parsed.eventChunks[1].index).toBe(1);
  });

  it('throws if not an object', () => {
    expect(() => parseManifest(null)).toThrow();
    expect(() => parseManifest('string')).toThrow();
  });

  it('throws on unsupported version', () => {
    expect(() => parseManifest({ version: 2, startUs: 0, endUs: 0 })).toThrow();
  });

  it('throws if startUs is not a number', () => {
    expect(() =>
      parseManifest({ version: 1, startUs: '0', endUs: 0 }),
    ).toThrow();
  });

  it('throws if eventChunks is missing', () => {
    expect(() => parseManifest({ version: 1, startUs: 0, endUs: 0 })).toThrow();
  });

  it('throws if a chunk has invalid file', () => {
    const raw = {
      version: 1,
      startUs: 0,
      endUs: 10_000_000,
      eventChunks: [{ file: 123, fromUs: 0, toUs: 10_000_000, count: 1 }],
    };
    expect(() => parseManifest(raw)).toThrow(/file must be a string/);
  });

  it('throws if a chunk has fromUs >= toUs', () => {
    const raw = {
      version: 1,
      startUs: 0,
      endUs: 10_000_000,
      eventChunks: [{ file: 'a.jsonl', fromUs: 10_000_000, toUs: 0, count: 1 }],
    };
    expect(() => parseManifest(raw)).toThrow(/fromUs must be < toUs/);
  });

  it('silently drops invalid logChunks', () => {
    const raw = {
      version: 1,
      startUs: 0,
      endUs: 10_000_000,
      eventChunks: [{ fromUs: 0, toUs: 10_000_000, file: 'a.jsonl', count: 1 }],
      logChunks: [
        { fromUs: 0, toUs: 5_000_000, file: 'logs.jsonl', count: 1 },
        { fromUs: 0, toUs: 5_000_000, file: 123, count: 1 }, // file invalide
        { fromUs: 5_000_000, toUs: 3_000_000, file: 'b.jsonl', count: 1 }, // fromUs >= toUs
      ],
    };
    expect(parseManifest(raw).logChunks).toHaveLength(1);
  });

  it('silently drops invalid checkpoints', () => {
    const raw = {
      version: 1,
      startUs: 0,
      endUs: 10_000_000,
      eventChunks: [{ fromUs: 0, toUs: 10_000_000, file: 'a.jsonl', count: 1 }],
      checkpoints: [
        { chunkIndex: 0, file: 'cp_0000.json' },
        { chunkIndex: '0', file: 'cp_bad.json' }, // chunkIndex invalide
        { file: 'cp_noindex.json' }, // chunkIndex absent
      ],
    };
    expect(parseManifest(raw).checkpoints).toHaveLength(1);
  });
});
