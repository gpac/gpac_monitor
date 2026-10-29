import { PayloadAction } from '@reduxjs/toolkit';
import { FilterView, OpenPreviews, ViewMode, WidgetsState } from './types';
import { detachFilterView } from './widgetUtils';

export type FilterViewStatePatch = Partial<
  Omit<FilterView, 'mode' | 'widgetId'>
>;

export const writeFilterViewMode = (
  state: WidgetsState,
  filterIdx: number,
  mode: ViewMode,
  widgetId?: string,
) => {
  const current = state.viewByFilter[filterIdx];
  if (!current) {
    state.viewByFilter[filterIdx] = widgetId ? { mode, widgetId } : { mode };
    return;
  }
  current.mode = mode;
  if (widgetId) current.widgetId = widgetId;
  else delete current.widgetId;
};

export const setFilterViewStateReducer = (
  state: WidgetsState,
  action: PayloadAction<{ filterIdx: number; patch: FilterViewStatePatch }>,
) => {
  const current = state.viewByFilter[action.payload.filterIdx];
  if (!current) return;
  Object.assign(current, action.payload.patch);
};

export const openPidPreviewReducer = (
  state: WidgetsState,
  action: PayloadAction<{
    filterIdx: number;
    name: string;
    pidIdx: number;
    variant: keyof OpenPreviews;
  }>,
) => {
  const { filterIdx, name, pidIdx, variant } = action.payload;
  if (state.viewByFilter[filterIdx]?.mode !== 'detached') {
    detachFilterView(state, filterIdx, name);
  }
  const current = state.viewByFilter[filterIdx];
  if (!current) return;
  current.activeTab = variant === 'input' ? 'inputs' : 'outputs';
  current.openPreviews ??= { input: [], output: [] };
  const openPidIdxs = current.openPreviews[variant];
  if (!openPidIdxs.includes(pidIdx)) openPidIdxs.push(pidIdx);
};
