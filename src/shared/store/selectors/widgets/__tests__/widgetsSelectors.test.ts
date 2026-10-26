import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import widgetsReducer, {
  openFilterInline,
  attachFilter,
  closeFilter,
  setFilterViewState,
} from '@/shared/store/widgets/widgetsSlice';
import type { FilterView } from '@/shared/store/widgets/widgetsSlice';
import { filtersUpdated } from '@/shared/store/actions/globalActions';
import {
  selectFilterViewModes,
  selectHasMonitoredFilter,
} from '../widgetsSelectors';

const createStore = (
  viewByFilter: Record<number, FilterView | undefined> = {},
) => {
  const initialWidgetsState = widgetsReducer(undefined, { type: 'test/init' });
  return configureStore({
    reducer: { widgets: widgetsReducer },
    preloadedState: { widgets: { ...initialWidgetsState, viewByFilter } },
  });
};

const detachedView: FilterView = { mode: 'detached', widgetId: 'widget-2' };

describe('selectHasMonitoredFilter', () => {
  it('returns false when no filter view is open', () => {
    const store = createStore();

    expect(selectHasMonitoredFilter(store.getState())).toBe(false);
  });

  it('returns true for an inline filter view', () => {
    const store = createStore();
    store.dispatch(openFilterInline(1));

    expect(selectHasMonitoredFilter(store.getState())).toBe(true);
  });

  it('returns true for a detached filter view and after reattaching it', () => {
    const store = createStore({ 2: detachedView });
    expect(selectHasMonitoredFilter(store.getState())).toBe(true);

    store.dispatch(attachFilter(2));
    expect(selectHasMonitoredFilter(store.getState())).toBe(true);
  });

  it('stays true after a partial close and turns false after the last close', () => {
    const store = createStore({ 2: detachedView });
    store.dispatch(openFilterInline(1));

    store.dispatch(closeFilter(1));
    expect(selectHasMonitoredFilter(store.getState())).toBe(true);

    store.dispatch(closeFilter(2));
    expect(selectHasMonitoredFilter(store.getState())).toBe(false);
  });

  it('returns false when the monitored filter disappears from the graph', () => {
    const store = createStore();
    store.dispatch(openFilterInline(1));
    store.dispatch(filtersUpdated([]));

    expect(selectHasMonitoredFilter(store.getState())).toBe(false);
  });
});

describe('selectFilterViewModes', () => {
  it('returns an empty record when no filter view is open', () => {
    const store = createStore();

    expect(selectFilterViewModes(store.getState())).toEqual({});
  });

  it('keeps the same reference when only the active tab changes', () => {
    const store = createStore({ 2: detachedView });
    store.dispatch(openFilterInline(1));
    const modesBefore = selectFilterViewModes(store.getState());

    store.dispatch(
      setFilterViewState({ filterIdx: 1, patch: { activeTab: 'inputs' } }),
    );

    expect(selectFilterViewModes(store.getState())).toBe(modesBefore);
    expect(modesBefore).toEqual({ 1: 'inline', 2: 'detached' });
  });

  it('returns a new record when a filter changes mode', () => {
    const store = createStore({ 2: detachedView });
    const modesBefore = selectFilterViewModes(store.getState());

    store.dispatch(attachFilter(2));

    const modesAfter = selectFilterViewModes(store.getState());
    expect(modesAfter).not.toBe(modesBefore);
    expect(modesAfter).toEqual({ 2: 'inline' });
  });
});
