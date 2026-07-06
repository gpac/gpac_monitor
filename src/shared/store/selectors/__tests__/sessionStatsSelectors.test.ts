import { describe, it, expect } from 'vitest';
import { selectStalledFilters } from '../session/sessionStatsSelectors';
import type { RootState } from '../../index';
import type {
  SessionFilterStats,
  SessionStatsState,
} from '../../slices/sessionStatsSlice';

const makeFilter = (
  overrides: Partial<SessionFilterStats> = {},
): SessionFilterStats => ({
  idx: 0,
  status: '',
  bytes_done: 100,
  bytes_sent: 50,
  pck_sent: 10,
  pck_done: 10,
  nb_opid: 1,
  nb_ipid: 1,
  time: 1000,
  is_eos: false,
  ...overrides,
});

const makeState = (
  sessionStats: Record<string, SessionFilterStats>,
  previousSessionStats: Record<string, SessionFilterStats>,
): RootState =>
  ({
    sessionStats: {
      sessionStats,
      previousSessionStats,
      mode: 'session',
      selectedFilterId: null,
      lastUpdate: null,
      lastUpdateUs: null,
      sessionStartUs: null,
      isLoading: false,
      subscribedComponents: [],
      isSubscribed: false,
      metricDefinitions: {},
    } satisfies SessionStatsState,
  }) as unknown as RootState;

describe('selectStalledFilters', () => {
  it('marks filter as stalled when no metric progressed', () => {
    const filter = makeFilter({ bytes_done: 100, pck_sent: 10 });
    const state = makeState({ '0': filter }, { '0': filter });

    expect(selectStalledFilters(state)['0']).toBe(true);
  });

  it('marks filter as active when bytes_done progressed', () => {
    const prev = makeFilter({ bytes_done: 100 });
    const curr = makeFilter({ bytes_done: 200 });
    const state = makeState({ '0': curr }, { '0': prev });

    expect(selectStalledFilters(state)['0']).toBe(false);
  });

  it('returns same reference when stalled values do not change', () => {
    const filter = makeFilter();
    const state1 = makeState({ '0': filter }, { '0': filter });
    const state2 = makeState({ '0': filter }, { '0': filter });

    const result1 = selectStalledFilters(state1);
    const result2 = selectStalledFilters(state2);

    expect(result1).toBe(result2);
  });

  it('returns new reference when a filter flips from active to stalled', () => {
    const filter = makeFilter();
    const stateActive = makeState(
      { '0': makeFilter({ bytes_done: 200 }) },
      { '0': makeFilter({ bytes_done: 100 }) },
    );
    const stateStalled = makeState({ '0': filter }, { '0': filter });

    const result1 = selectStalledFilters(stateActive);
    const result2 = selectStalledFilters(stateStalled);

    expect(result1).not.toBe(result2);
  });

  it('marks filter as not stalled when no previous data', () => {
    const filter = makeFilter();
    const state = makeState({ '0': filter }, {});

    expect(selectStalledFilters(state)['0']).toBe(false);
  });

  it('marks EOS filter as not stalled', () => {
    const filter = makeFilter({ is_eos: true });
    const state = makeState({ '0': filter }, { '0': filter });

    expect(selectStalledFilters(state)['0']).toBe(false);
  });
});
