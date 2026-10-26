import { describe, it, expect } from 'vitest';
import monitoredFilterReducer, {
  setSelectedStatusMetric,
  setParsedStatuses,
  toggleSelectedPid,
} from '../monitoredFilterSlice';
import { filtersUpdated } from '@/shared/store/actions/globalActions';
import type { GraphFilterData } from '@/types/domain/gpac/model';

const makeGraphFilter = (idx: number): GraphFilterData => ({
  idx,
  name: `filter${idx}`,
  type: 'filter',
  status: 'running',
  itag: null,
  ID: null,
  nb_ipid: 0,
  nb_opid: 0,
  ipid: [],
  opid: [],
});

describe('filtersUpdated', () => {
  it('drops selected PID targets of filters no longer in the graph', () => {
    let state = monitoredFilterReducer(undefined, { type: '@@INIT' });
    state = monitoredFilterReducer(
      state,
      toggleSelectedPid({ filterIdx: 1, direction: 'input', pidIndex: 2 }),
    );
    state = monitoredFilterReducer(
      state,
      toggleSelectedPid({ filterIdx: 3, direction: 'output', pidIndex: 0 }),
    );

    state = monitoredFilterReducer(state, filtersUpdated([makeGraphFilter(3)]));

    expect(state.selectedPidTargets).toEqual([
      { filterIdx: 3, direction: 'output', pidIndex: 0 },
    ]);
  });
});

describe('setSelectedStatusMetric', () => {
  it('toggles off an already-selected metric', () => {
    let state = monitoredFilterReducer(undefined, { type: '@@INIT' });
    state = monitoredFilterReducer(
      state,
      setSelectedStatusMetric({ filterIdx: 0, metricKey: 'fps' }),
    );
    state = monitoredFilterReducer(
      state,
      setSelectedStatusMetric({ filterIdx: 0, metricKey: 'fps' }),
    );
    expect(state.selectedStatusMetricByFilter[0]).toEqual([]);
  });

  it('evicts the oldest when 4 are selected and a new one is added', () => {
    let state = monitoredFilterReducer(undefined, { type: '@@INIT' });
    for (const key of ['fps', 'Q', 'LAT', 'buffer']) {
      state = monitoredFilterReducer(
        state,
        setSelectedStatusMetric({ filterIdx: 0, metricKey: key }),
      );
    }
    expect(state.selectedStatusMetricByFilter[0]).toHaveLength(4);

    state = monitoredFilterReducer(
      state,
      setSelectedStatusMetric({ filterIdx: 0, metricKey: 'frames' }),
    );

    expect(state.selectedStatusMetricByFilter[0]).toHaveLength(4);
    expect(state.selectedStatusMetricByFilter[0]).not.toContain('fps');
    expect(state.selectedStatusMetricByFilter[0]).toContain('frames');
    expect(state.selectedStatusMetricByFilter[0]).toEqual([
      'Q',
      'LAT',
      'buffer',
      'frames',
    ]);
  });
});

describe('setParsedStatuses', () => {
  it('keeps the same reference when raw status is unchanged', () => {
    let state = monitoredFilterReducer(undefined, { type: '@@INIT' });

    state = monitoredFilterReducer(
      state,
      setParsedStatuses([
        {
          filterIdx: 3,
          parsedStatus: { raw: 'fps=30 buffer=120', entries: [] },
        },
      ]),
    );
    const firstReference = state.parsedStatusByFilterIdx[3];

    state = monitoredFilterReducer(
      state,
      setParsedStatuses([
        {
          filterIdx: 3,
          parsedStatus: { raw: 'fps=30 buffer=120', entries: [] },
        },
      ]),
    );
    const secondReference = state.parsedStatusByFilterIdx[3];

    expect(secondReference).toBe(firstReference);
  });

  it('writes a new reference when raw status changes', () => {
    let state = monitoredFilterReducer(undefined, { type: '@@INIT' });

    state = monitoredFilterReducer(
      state,
      setParsedStatuses([
        { filterIdx: 3, parsedStatus: { raw: 'fps=30', entries: [] } },
      ]),
    );
    const firstReference = state.parsedStatusByFilterIdx[3];

    state = monitoredFilterReducer(
      state,
      setParsedStatuses([
        { filterIdx: 3, parsedStatus: { raw: 'fps=60', entries: [] } },
      ]),
    );
    const secondReference = state.parsedStatusByFilterIdx[3];

    expect(secondReference).not.toBe(firstReference);
    expect(secondReference.raw).toBe('fps=60');
  });
});
