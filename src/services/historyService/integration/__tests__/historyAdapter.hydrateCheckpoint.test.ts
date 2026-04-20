import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HistoryAdapter } from '../historyAdapter';
import type { HistoryCheckpoint } from '../historyAdapter';
import type { GraphFilterData } from '@/types/domain/gpac/model';

const makeCheckpoint = (
  overrides?: Partial<HistoryCheckpoint>,
): HistoryCheckpoint => ({
  ts_us: 5_000_000,
  filters: [{ idx: 0, name: 'src', links: [] } as unknown as GraphFilterData],
  pidsByFilter: { '0': { ipids: {}, opids: {} } as any },
  argsByFilter: { '0': [{ name: 'src', value: 'file.mp4' } as any] },
  ...overrides,
});

describe('HistoryAdapter.hydrateCheckpoint', () => {
  let dispatch: ReturnType<typeof vi.fn>;
  let adapter: HistoryAdapter;

  beforeEach(() => {
    dispatch = vi.fn();
    adapter = new HistoryAdapter(dispatch as any);
  });

  it('dispatches clearGraph, filtersUpdated, clearFilterPids, setFilterPids, hydrateFilterArgs', () => {
    const cp = makeCheckpoint();
    adapter.hydrateCheckpoint(cp);

    const types = dispatch.mock.calls.map(([action]: any) => action.type);
    expect(types).toContain('graph/clearGraph');
    expect(types).toContain('graph/filtersUpdated');
    expect(types).toContain('sessionStats/clearFilterPids');
    expect(types).toContain('sessionStats/setFilterPids');
    expect(types).toContain('filterArgument/hydrateFilterArgs');
  });

  it('dispatches clearGraph before filtersUpdated', () => {
    adapter.hydrateCheckpoint(makeCheckpoint());
    const types = dispatch.mock.calls.map(([action]: any) => action.type);
    const clearIdx = types.indexOf('graph/clearGraph');
    const filtersIdx = types.indexOf('graph/filtersUpdated');
    expect(clearIdx).toBeLessThan(filtersIdx);
  });

  it('dispatches clearFilterPids before setFilterPids', () => {
    adapter.hydrateCheckpoint(makeCheckpoint());
    const types = dispatch.mock.calls.map(([action]: any) => action.type);
    const clearIdx = types.indexOf('sessionStats/clearFilterPids');
    const setIdx = types.indexOf('sessionStats/setFilterPids');
    expect(clearIdx).toBeLessThan(setIdx);
  });

  it('passes checkpoint filters payload to filtersUpdated', () => {
    const cp = makeCheckpoint();
    adapter.hydrateCheckpoint(cp);
    const call = dispatch.mock.calls.find(
      ([action]: any) => action.type === 'graph/filtersUpdated',
    );
    expect(call?.[0].payload).toEqual(cp.filters);
  });

  it('passes pidsByFilter payload to setFilterPids', () => {
    const cp = makeCheckpoint();
    adapter.hydrateCheckpoint(cp);
    const call = dispatch.mock.calls.find(
      ([action]: any) => action.type === 'sessionStats/setFilterPids',
    );
    expect(call?.[0].payload).toEqual(cp.pidsByFilter);
  });

  it('passes argsByFilter payload to hydrateFilterArgs', () => {
    const cp = makeCheckpoint();
    adapter.hydrateCheckpoint(cp);
    const call = dispatch.mock.calls.find(
      ([action]: any) => action.type === 'filterArgument/hydrateFilterArgs',
    );
    expect(call?.[0].payload).toEqual(cp.argsByFilter);
  });

  it('resets temporal state — no stats dispatched after checkpoint', () => {
    // Simulate prior silent warmup state
    adapter.setSilent(true);
    // setSilent(true) calls resetTemporalState — state is clean
    // Now hydrateCheckpoint should also reset
    adapter.hydrateCheckpoint(makeCheckpoint());
    dispatch.mockClear();

    // flush on a freshly reset adapter must not dispatch stats
    adapter.flush();
    const statsTypes = dispatch.mock.calls
      .map(([action]: any) => action.type)
      .filter(
        (type: string) =>
          type.includes('bulkAdd') || type.includes('addNetworkDataPoint'),
      );
    expect(statsTypes).toHaveLength(0);
  });

  it('works with empty pidsByFilter', () => {
    expect(() =>
      adapter.hydrateCheckpoint(makeCheckpoint({ pidsByFilter: {} })),
    ).not.toThrow();
  });

  it('works with empty argsByFilter', () => {
    expect(() =>
      adapter.hydrateCheckpoint(makeCheckpoint({ argsByFilter: {} })),
    ).not.toThrow();
  });

  it('does not dispatch logs', () => {
    adapter.hydrateCheckpoint(makeCheckpoint());
    const logTypes = dispatch.mock.calls
      .map(([action]: any) => action.type)
      .filter((type: string) => type.toLowerCase().includes('log'));
    expect(logTypes).toHaveLength(0);
  });

  it('does not dispatch stats (bandwidth, cpu)', () => {
    adapter.hydrateCheckpoint(makeCheckpoint());
    const statsTypes = dispatch.mock.calls
      .map(([action]: any) => action.type)
      .filter(
        (type: string) =>
          type.includes('NetworkData') || type.includes('SystemStats'),
      );
    expect(statsTypes).toHaveLength(0);
  });
});
