import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HistoryAdapter } from '../historyAdapter';
import type { HistoryCheckpoint } from '../historyAdapter';
import {
  toGraphFilterData,
  buildPidsByFilter,
  buildArgsByFilter,
} from '../../loader/snapshotHydrator';
import type { HistoryFilter } from '../../types';

const baseFilter: HistoryFilter = {
  idx: 0,
  name: 'src',
  type: 'input',
  status: 'connected',
  nb_ipid: 0,
  nb_opid: 1,
  ipids: {},
  opids: {},
  gpac_args: [{ name: 'src', value: 'file.mp4' } as any],
};

const makeCheckpoint = (
  overrides?: Partial<HistoryCheckpoint>,
): HistoryCheckpoint => ({
  version: 1,
  ts_us: 5_000_000,
  graph_v: 1,
  filters: [baseFilter],
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
    expect(types.indexOf('graph/clearGraph')).toBeLessThan(
      types.indexOf('graph/filtersUpdated'),
    );
  });

  it('dispatches clearFilterPids before setFilterPids', () => {
    adapter.hydrateCheckpoint(makeCheckpoint());
    const types = dispatch.mock.calls.map(([action]: any) => action.type);
    expect(types.indexOf('sessionStats/clearFilterPids')).toBeLessThan(
      types.indexOf('sessionStats/setFilterPids'),
    );
  });

  it('passes transformed filters to filtersUpdated', () => {
    const cp = makeCheckpoint();
    adapter.hydrateCheckpoint(cp);
    const call = dispatch.mock.calls.find(
      ([action]: any) => action.type === 'graph/filtersUpdated',
    );
    expect(call?.[0].payload).toEqual(cp.filters.map(toGraphFilterData));
  });

  it('passes pidsByFilter derived from filters to setFilterPids', () => {
    const cp = makeCheckpoint();
    adapter.hydrateCheckpoint(cp);
    const call = dispatch.mock.calls.find(
      ([action]: any) => action.type === 'sessionStats/setFilterPids',
    );
    expect(call?.[0].payload).toEqual(buildPidsByFilter(cp.filters));
  });

  it('passes argsByFilter derived from filters to hydrateFilterArgs', () => {
    const cp = makeCheckpoint();
    adapter.hydrateCheckpoint(cp);
    const call = dispatch.mock.calls.find(
      ([action]: any) => action.type === 'filterArgument/hydrateFilterArgs',
    );
    expect(call?.[0].payload).toEqual(buildArgsByFilter(cp.filters));
  });

  it('resets temporal state — no stats dispatched after checkpoint', () => {
    adapter.setSilent(true);
    adapter.hydrateCheckpoint(makeCheckpoint());
    dispatch.mockClear();

    adapter.flush();
    const statsTypes = dispatch.mock.calls
      .map(([action]: any) => action.type)
      .filter(
        (type: string) =>
          type.includes('bulkAdd') || type.includes('addNetworkDataPoint'),
      );
    expect(statsTypes).toHaveLength(0);
  });

  it('works with empty filters', () => {
    expect(() =>
      adapter.hydrateCheckpoint(makeCheckpoint({ filters: [] })),
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
