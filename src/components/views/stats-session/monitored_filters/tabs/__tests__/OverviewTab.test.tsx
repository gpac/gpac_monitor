import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import monitoredFilterReducer, {
  addStatusMetricSamples,
} from '@/shared/store/slices/monitoredFilterSlice';
import sessionStatsReducer from '@/shared/store/slices/sessionStatsSlice';
import OverviewTab from '../OverviewTab';
import type { OverviewTabData } from '@/types/ui';

// StatusGraphCard pulls the `@/shared/hooks` barrel (useGpacService -> live
// service singleton -> real `@/shared/store`), unrelated to this lifecycle test.
vi.mock('../status/StatusGraphCard', () => ({ default: () => null }));

const makeStore = () =>
  configureStore({
    reducer: {
      monitoredFilter: monitoredFilterReducer,
      sessionStats: sessionStatsReducer,
    },
  });

const filter: OverviewTabData = {
  name: 'TestFilter',
  type: 'demux',
  filterIdx: 0,
  status: '',
  parsedStatus: { raw: '', entries: [] },
  time: 1000,
  pck_done: 0,
  pck_sent: 0,
  bytes_done: 0,
  bytes_sent: 0,
  nb_ipid: 0,
  nb_opid: 0,
};

describe('OverviewTab — status samples lifecycle', () => {
  it('keeps status samples in the store after unmount (tab switch)', () => {
    const store = makeStore();
    store.dispatch(
      addStatusMetricSamples([
        { key: '0:fps', sample: { sessionTimeUs: 1000, value: 30 } },
      ]),
    );

    const { unmount } = render(
      <Provider store={store}>
        <OverviewTab filter={filter} />
      </Provider>,
    );

    unmount();

    expect(
      store.getState().monitoredFilter.statusMetricSamples['0:fps'],
    ).toEqual([{ sessionTimeUs: 1000, value: 30 }]);
  });
});
