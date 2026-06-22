import { describe, it, expect, vi } from 'vitest';
import { HistoryController } from '../historyController';
import type { HistorySource, HistoryManifest } from '../source/types';
import type { HistorySnapshot } from '../types';

const makeManifest = (withCheckpoint: boolean): HistoryManifest => ({
  version: 1,
  startUs: 0,
  endUs: 10_000_000,
  chunkDurationUs: 10_000_000,
  chunkCount: 1,
  checkpoints: withCheckpoint
    ? [{ chunkIndex: 0, file: 'checkpoints/cp_0000.json' }]
    : [],
});

const makeSnapshot = (): HistorySnapshot => ({
  version: 1,
  ts_us: 0,
  command_line: null,
  graph_v: 1,
  filters: [],
});

function makeSource(withCheckpoint: boolean): HistorySource {
  return {
    sessionId: 'test-session',
    getManifest: vi.fn().mockResolvedValue(makeManifest(withCheckpoint)),
    loadSnapshot: vi.fn().mockResolvedValue(makeSnapshot()),
    readChunk: vi.fn().mockResolvedValue([]),
    readLogChunk: vi.fn().mockResolvedValue([]),
    readCheckpoint: vi.fn().mockResolvedValue(null),
  };
}

describe('HistoryController.seek — stale seek does not clear store', () => {
  it('does not call clearTimeSeriesData when checkpoint seek is superseded (cp path)', async () => {
    const controller = new HistoryController();
    const source = makeSource(true);
    await controller.load(source as any, vi.fn() as any);

    const adapter = (controller as any).adapter;
    const clearSpy = vi.spyOn(adapter, 'clearTimeSeriesData');

    source.readCheckpoint.mockImplementation(async () => {
      (controller as any).preloader?.invalidate();
      return null;
    });

    await controller.seek(5_000_000);

    expect(clearSpy).not.toHaveBeenCalled();
  });

  it('does not call clearTimeSeriesData when no-checkpoint seek is superseded (!cp path)', async () => {
    const controller = new HistoryController();
    const source = makeSource(false);
    await controller.load(source as any, vi.fn() as any);

    const adapter = (controller as any).adapter;
    const clearSpy = vi.spyOn(adapter, 'clearTimeSeriesData');

    source.readChunk.mockImplementation(async () => {
      (controller as any).preloader?.invalidate();
      return [];
    });

    await controller.seek(5_000_000);

    expect(clearSpy).not.toHaveBeenCalled();
  });

  it('calls clearTimeSeriesData when seek is not superseded', async () => {
    const controller = new HistoryController();
    const source = makeSource(false);
    await controller.load(source as any, vi.fn() as any);

    const adapter = (controller as any).adapter;
    const clearSpy = vi.spyOn(adapter, 'clearTimeSeriesData');

    await controller.seek(5_000_000);

    expect(clearSpy).toHaveBeenCalledOnce();
  });
});
