import { describe, it, expect, vi } from 'vitest';
import { ChunkLoader } from '../chunkLoader';
import type { HistoryManifest, IChunkReader } from '../source/types';
import type { HistoryEvent } from '../types';

const manifest: HistoryManifest = {
  version: 1,
  startUs: 0,
  endUs: 20_000_000,
  chunkDurationUs: 10_000_000,
  chunkCount: 2,
};

const cpuEvent = {
  version: 1,
  ts_us: 1_000_000,
  message: 'cpu_stats',
  stats: {},
} as unknown as HistoryEvent;

describe('ChunkLoader.loadEventChunk — failed read', () => {
  it('rereads the source after a failed read instead of serving a cached empty chunk', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const reader: IChunkReader = {
      readChunk: vi
        .fn()
        .mockRejectedValueOnce(new Error('transient WS failure'))
        .mockResolvedValueOnce([cpuEvent]),
      readLogChunk: vi.fn().mockResolvedValue([]),
      readCheckpoint: vi.fn().mockResolvedValue(null),
    };
    const loader = new ChunkLoader(reader, manifest);

    await loader.loadEventChunk(0);
    const retried = await loader.loadEventChunk(0);

    expect(retried.events).toEqual([cpuEvent]);
    expect(reader.readChunk).toHaveBeenCalledTimes(2);
  });
});

describe('ChunkLoader.loadCheckpoint — malformed file', () => {
  it('returns null for a checkpoint without filters instead of passing it to seek', async () => {
    const reader: IChunkReader = {
      readChunk: vi.fn().mockResolvedValue([]),
      readLogChunk: vi.fn().mockResolvedValue([]),
      readCheckpoint: vi.fn().mockResolvedValue({ ts_us: 12_000_000 }),
    };
    const loader = new ChunkLoader(reader, manifest);

    const checkpoint = await loader.loadCheckpoint('checkpoints/cp_0001.json');

    expect(checkpoint).toBeNull();
  });
});
