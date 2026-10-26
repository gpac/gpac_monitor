import { PayloadAction } from '@reduxjs/toolkit';
import { FilterView, ViewMode, WidgetsState } from './types';

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
