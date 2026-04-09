import { describe, it, expect } from 'vitest';
import reducer, {
  updateSessionStats,
  setFilterPids,
  clearFilterPids,
  SessionStatsState,
} from '../sessionStatsSlice';
import type { SessionFilterStats } from '../sessionStatsSlice';

const initialState: SessionStatsState = {
  mode: 'session',
  sessionStats: {},
  previousSessionStats: {},
  pidsByFilter: {},
  selectedFilterId: null,
  lastUpdate: null,
  lastUpdateUs: null,
  isLoading: false,
  subscribedComponents: [],
  isSubscribed: false,
};

const makeFilter = (
  idx: number,
  bytes_sent = 0,
  bytes_done = 0,
): SessionFilterStats => ({
  idx,
  status: 'play',
  bytes_done,
  bytes_sent,
  pck_sent: 0,
  pck_done: 0,
  nb_opid: 1,
  nb_ipid: 1,
  time: 0,
});

describe('sessionStatsSlice — updateSessionStats', () => {
  it('array form (live compat) stores null in lastUpdateUs', () => {
    const state = reducer(
      initialState,
      updateSessionStats([makeFilter(0, 100)]),
    );
    expect(state.lastUpdateUs).toBeNull();
    expect(state.sessionStats['0'].bytes_sent).toBe(100);
  });

  it('object form with ts_us stores the GPAC timestamp', () => {
    const state = reducer(
      initialState,
      updateSessionStats({ stats: [makeFilter(0, 500)], ts_us: 1_500_000 }),
    );
    expect(state.lastUpdateUs).toBe(1_500_000);
    expect(state.sessionStats['0'].bytes_sent).toBe(500);
  });

  it('object form without ts_us stores null', () => {
    const state = reducer(
      initialState,
      updateSessionStats({ stats: [makeFilter(0)] }),
    );
    expect(state.lastUpdateUs).toBeNull();
  });

  it('saves current stats as previousSessionStats before update', () => {
    const s1 = reducer(
      initialState,
      updateSessionStats({ stats: [makeFilter(0, 100)], ts_us: 1_000_000 }),
    );
    const s2 = reducer(
      s1,
      updateSessionStats({ stats: [makeFilter(0, 200)], ts_us: 2_000_000 }),
    );
    expect(s2.previousSessionStats['0'].bytes_sent).toBe(100);
    expect(s2.sessionStats['0'].bytes_sent).toBe(200);
  });

  it('rate formula: 1000 bytes in 1s = 1000 bytes/s (upload)', () => {
    const s1 = reducer(
      initialState,
      updateSessionStats({ stats: [makeFilter(0, 0)], ts_us: 1_000_000 }),
    );
    const s2 = reducer(
      s1,
      updateSessionStats({ stats: [makeFilter(0, 1000)], ts_us: 2_000_000 }),
    );
    const deltaTimeSec = (s2.lastUpdateUs! - s1.lastUpdateUs!) / 1_000_000;
    const rate =
      (s2.sessionStats['0'].bytes_sent -
        s2.previousSessionStats['0'].bytes_sent) /
      deltaTimeSec;
    expect(deltaTimeSec).toBe(1);
    expect(rate).toBe(1000);
  });

  it('rate formula: 2000 bytes_done in 1s = 2000 bytes/s (download)', () => {
    const s1 = reducer(
      initialState,
      updateSessionStats({ stats: [makeFilter(0, 0, 0)], ts_us: 1_000_000 }),
    );
    const s2 = reducer(
      s1,
      updateSessionStats({ stats: [makeFilter(0, 0, 2000)], ts_us: 2_000_000 }),
    );
    const deltaTimeSec = (s2.lastUpdateUs! - s1.lastUpdateUs!) / 1_000_000;
    const rate =
      (s2.sessionStats['0'].bytes_done -
        s2.previousSessionStats['0'].bytes_done) /
      deltaTimeSec;
    expect(rate).toBe(2000);
  });
});

describe('sessionStatsSlice — setFilterPids', () => {
  const pid = (name: string) => ({ name }) as any;

  it('merges per-entry: other filters are preserved', () => {
    // Regression: setFilterPids used to replace the entire dict
    const withTwo = reducer(
      initialState,
      setFilterPids({
        '1': { ipids: { a: pid('a') }, opids: { x: pid('x') } },
        '2': { ipids: { b: pid('b') }, opids: { y: pid('y') } },
      }),
    );
    // Update only filter 1 ipids (simulating filter_pid_reconfigured)
    const updated = reducer(
      withTwo,
      setFilterPids({ '1': { ipids: { a2: pid('a2') } } }),
    );
    // Filter 2 must still be there
    expect(updated.pidsByFilter['2']).toBeDefined();
    expect(updated.pidsByFilter['2'].ipids?.b).toBeDefined();
  });

  it('preserves opids when only ipids are updated', () => {
    // Regression: filter_pid_reconfigured only sends ipids, must not wipe opids
    const initial = reducer(
      initialState,
      setFilterPids({
        '3': { ipids: { a: pid('a') }, opids: { x: pid('x') } },
      }),
    );
    const updated = reducer(
      initial,
      setFilterPids({ '3': { ipids: { a2: pid('a2') } } }),
    );
    expect(updated.pidsByFilter['3'].opids?.x).toBeDefined();
    expect(updated.pidsByFilter['3'].ipids?.a2).toBeDefined();
    expect(updated.pidsByFilter['3'].ipids?.a).toBeUndefined();
  });

  it('clearFilterPids empties the dict', () => {
    const withData = reducer(
      initialState,
      setFilterPids({ '1': { ipids: { a: pid('a') } } }),
    );
    const cleared = reducer(withData, clearFilterPids());
    expect(withData.pidsByFilter['1']).toBeDefined();
    expect(cleared.pidsByFilter).toEqual({});
  });

  it('clearFilterPids + setFilterPids gives clean state (hydrate pattern)', () => {
    const stale = reducer(
      initialState,
      setFilterPids({ '99': { ipids: { stale: pid('stale') } } }),
    );
    const cleared = reducer(stale, clearFilterPids());
    const fresh = reducer(
      cleared,
      setFilterPids({
        '1': { ipids: { a: pid('a') }, opids: { x: pid('x') } },
      }),
    );
    expect(fresh.pidsByFilter['99']).toBeUndefined();
    expect(fresh.pidsByFilter['1'].ipids?.a).toBeDefined();
  });
});
