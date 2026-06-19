import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import monitoredFilterReducer, {
  addStatusMetricSamples,
} from '../../../../../../../shared/store/slices/monitoredFilterSlice';
import { useStatusMetricChartData } from '../useStatusMetricChartData';

const makeStore = () =>
  configureStore({ reducer: { monitoredFilter: monitoredFilterReducer } });

const makeWrapper =
  (store: ReturnType<typeof makeStore>) =>
  ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

describe('useStatusMetricChartData — series stability', () => {
  it('series reference is stable when a new sample arrives (tick simulation)', () => {
    const store = makeStore();
    store.dispatch(
      addStatusMetricSamples([
        { key: '0:fps', sample: { sessionTimeUs: 1000, value: 30 } },
      ]),
    );

    const selectedKeys = ['fps'];
    const { result } = renderHook(
      () => useStatusMetricChartData(0, selectedKeys, 100),
      { wrapper: makeWrapper(store) },
    );

    const seriesAfterFirstTick = result.current.series;
    const dataAfterFirstTick = result.current.data;

    void act(() => {
      store.dispatch(
        addStatusMetricSamples([
          { key: '0:fps', sample: { sessionTimeUs: 2000, value: 35 } },
        ]),
      );
    });

    expect(result.current.series).toBe(seriesAfterFirstTick);
    expect(result.current.data).not.toBe(dataAfterFirstTick);
  });

  it('series reference changes when selectedKeys changes', () => {
    const store = makeStore();
    store.dispatch(
      addStatusMetricSamples([
        { key: '0:fps', sample: { sessionTimeUs: 1000, value: 30 } },
        { key: '0:frames', sample: { sessionTimeUs: 1000, value: 10 } },
      ]),
    );

    let selectedKeys = ['fps'];
    const { result, rerender } = renderHook(
      () => useStatusMetricChartData(0, selectedKeys, 100),
      { wrapper: makeWrapper(store) },
    );

    const seriesBefore = result.current.series;

    selectedKeys = ['fps', 'frames'];
    rerender();

    expect(result.current.series).not.toBe(seriesBefore);
    expect(result.current.series).toHaveLength(2);
  });
});
