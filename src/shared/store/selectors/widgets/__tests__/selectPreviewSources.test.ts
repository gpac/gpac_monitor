import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import graphReducer from '@/shared/store/slices/graphSlice';
import widgetsReducer, {
  openFilterInline,
  setFilterViewState,
} from '@/shared/store/widgets/widgetsSlice';
import { filtersUpdated } from '@/shared/store/actions/globalActions';
import type { GraphFilterData } from '@/types/domain/gpac/model';
import filtersFixture from '@/services/ws/__tests__/fixtures/filters.json';
import monitorConfigReducer, {
  setServerProtocolVersion,
} from '@/shared/store/slices/monitorConfigSlice';
import { PREVIEW_MIN_WS_PROTOCOL_VERSION } from '@/services/ws/protocolVersion';
import { selectPreviewSources } from '../widgetsSelectors';

const createStore = () => {
  const store = configureStore({
    reducer: {
      graph: graphReducer,
      widgets: widgetsReducer,
      monitorConfig: monitorConfigReducer,
    },
  });
  store.dispatch(setServerProtocolVersion(PREVIEW_MIN_WS_PROTOCOL_VERSION));
  return store;
};

const loadFixtureGraph = (store: ReturnType<typeof createStore>) =>
  store.dispatch(filtersUpdated(filtersFixture.filters as GraphFilterData[]));

describe('selectPreviewSources', () => {
  it('returns an empty list when the graph is empty', () => {
    const store = createStore();

    expect(selectPreviewSources(store.getState())).toEqual([]);
  });

  it('keeps only visual PIDs, grouped by filter', () => {
    const store = createStore();
    loadFixtureGraph(store);

    expect(selectPreviewSources(store.getState())).toEqual([
      {
        filterIdx: 0,
        filterName: 'avgen',
        pids: [
          { direction: 'output', pidIdx: 1, name: 'video', isOpen: false },
        ],
      },
      {
        filterIdx: 1,
        filterName: 'reframer',
        pids: [
          { direction: 'input', pidIdx: 1, name: 'video', isOpen: false },
          { direction: 'output', pidIdx: 1, name: 'video', isOpen: false },
        ],
      },
      {
        filterIdx: 2,
        filterName: 'inspect',
        pids: [{ direction: 'input', pidIdx: 1, name: 'video', isOpen: false }],
      },
    ]);
  });

  it('keeps the same reference when a graph update changes no video PID', () => {
    const store = createStore();
    loadFixtureGraph(store);
    const before = selectPreviewSources(store.getState());

    loadFixtureGraph(store);
    store.dispatch(openFilterInline(2));

    expect(selectPreviewSources(store.getState())).toBe(before);
  });

  it('marks a PID open only on the direction listed in openPreviews', () => {
    const store = createStore();
    loadFixtureGraph(store);
    store.dispatch(openFilterInline(1));
    store.dispatch(
      setFilterViewState({
        filterIdx: 1,
        patch: { openPreviews: { input: [1], output: [] } },
      }),
    );

    const reframer = selectPreviewSources(store.getState())[1];

    expect(reframer.pids.map((pid) => pid.isOpen)).toEqual([true, false]);
  });

  it('drops a video PID whose codec cannot be previewed', () => {
    const store = createStore();
    const filters = structuredClone(
      filtersFixture.filters,
    ) as GraphFilterData[];
    filters[0].opid[1].codec = 'raw';
    store.dispatch(filtersUpdated(filters));

    const sources = selectPreviewSources(store.getState());

    expect(sources.map((source) => source.filterName)).toEqual([
      'reframer',
      'inspect',
    ]);
  });

  it('offers an H.264 PID when the server announces version 1.1', () => {
    const store = createStore();
    const filters = structuredClone(
      filtersFixture.filters,
    ) as GraphFilterData[];
    filters[0].opid[1].codec = '264';
    store.dispatch(filtersUpdated(filters));
    store.dispatch(setServerProtocolVersion(1.1));

    const sources = selectPreviewSources(store.getState());

    expect(sources[0].filterName).toBe('avgen');
  });

  it('returns an empty list when the server announces version 1', () => {
    const store = createStore();
    loadFixtureGraph(store);
    store.dispatch(setServerProtocolVersion(1));

    expect(selectPreviewSources(store.getState())).toEqual([]);
  });

  it('returns an empty list when the server announces no version', () => {
    const store = createStore();
    loadFixtureGraph(store);
    store.dispatch(setServerProtocolVersion(undefined));

    expect(selectPreviewSources(store.getState())).toEqual([]);
  });
});
