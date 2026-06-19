import { describe, it, expect } from 'vitest';
import reducer, {
  updateSessionStats,
  clearSessionStats,
  resetSessionStats,
  unsubscribeFromSessionStats,
  subscribeToSessionStats,
} from '../sessionStatsSlice';
import type {
  SessionStatsState,
  SessionFilterStats,
} from '../sessionStatsSlice';

const initialState: SessionStatsState = reducer(undefined, { type: '@@INIT' });

const stat0: SessionFilterStats = {
  idx: 0,
  status: 'done info="dispatch canceled" prog=5000/135642397',
  bytes_done: 0,
  bytes_sent: 5000,
  pck_sent: 1,
  pck_done: 0,
  time: 21673,
  nb_ipid: 0,
  nb_opid: 1,
  is_eos: false,
  last_ts_sent: null,
};

const stat3: SessionFilterStats = {
  idx: 3,
  status: 'fps=663.18 frames=349 time=179712/12800 Q=3304 PT=P LAT=41',
  bytes_done: 539136000,
  bytes_sent: 2966447,
  pck_sent: 349,
  pck_done: 390,
  time: 566924,
  nb_ipid: 1,
  nb_opid: 1,
  is_eos: false,
  last_ts_sent: { num: 179712, den: 12800 },
};

const TS_FIRST = 16172920;
const TS_SECOND = 16672920;

describe('sessionStatsSlice — ts_us plumbing', () => {
  it('initialises sessionStartUs and lastUpdateUs to null', () => {
    expect(initialState.sessionStartUs).toBeNull();
    expect(initialState.lastUpdateUs).toBeNull();
  });

  it('sets sessionStartUs and lastUpdateUs on first tick with ts_us', () => {
    const state = reducer(
      initialState,
      updateSessionStats({ stats: [stat0, stat3], ts_us: TS_FIRST }),
    );
    expect(state.sessionStartUs).toBe(TS_FIRST);
    expect(state.lastUpdateUs).toBe(TS_FIRST);
  });

  it('advances lastUpdateUs but keeps sessionStartUs on subsequent tick', () => {
    let state = reducer(
      initialState,
      updateSessionStats({ stats: [stat0, stat3], ts_us: TS_FIRST }),
    );
    state = reducer(
      state,
      updateSessionStats({ stats: [stat0, stat3], ts_us: TS_SECOND }),
    );
    expect(state.sessionStartUs).toBe(TS_FIRST);
    expect(state.lastUpdateUs).toBe(TS_SECOND);
  });

  it('leaves both null when ts_us is absent from payload', () => {
    const state = reducer(initialState, updateSessionStats({ stats: [stat0] }));
    expect(state.lastUpdateUs).toBeNull();
    expect(state.sessionStartUs).toBeNull();
  });

  it('preserves existing stats correctly', () => {
    const state = reducer(
      initialState,
      updateSessionStats({ stats: [stat0, stat3], ts_us: TS_FIRST }),
    );
    expect(Object.keys(state.sessionStats)).toHaveLength(2);
    expect(state.sessionStats['3'].status).toBe(stat3.status);
  });

  it('resets both fields on clearSessionStats', () => {
    let state = reducer(
      initialState,
      updateSessionStats({ stats: [stat0], ts_us: TS_FIRST }),
    );
    state = reducer(state, clearSessionStats());
    expect(state.sessionStartUs).toBeNull();
    expect(state.lastUpdateUs).toBeNull();
  });

  it('resets both fields on resetSessionStats', () => {
    let state = reducer(
      initialState,
      updateSessionStats({ stats: [stat0], ts_us: TS_FIRST }),
    );
    state = reducer(state, resetSessionStats());
    expect(state.sessionStartUs).toBeNull();
    expect(state.lastUpdateUs).toBeNull();
  });

  it('resets both fields when last subscriber unsubscribes', () => {
    let state = reducer(initialState, subscribeToSessionStats('comp-a'));
    state = reducer(
      state,
      updateSessionStats({ stats: [stat0], ts_us: TS_FIRST }),
    );
    state = reducer(state, unsubscribeFromSessionStats('comp-a'));
    expect(state.sessionStartUs).toBeNull();
    expect(state.lastUpdateUs).toBeNull();
  });
});
