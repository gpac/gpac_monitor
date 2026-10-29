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
import { selectPreviewSources } from '../widgetsSelectors';

const createStore = () =>
  configureStore({
    reducer: { graph: graphReducer, widgets: widgetsReducer },
  });

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
});
