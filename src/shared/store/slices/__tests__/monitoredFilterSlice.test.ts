import { describe, it, expect } from 'vitest';
import monitoredFilterReducer, {
  setSelectedStatusMetric,
} from '../monitoredFilterSlice';

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
