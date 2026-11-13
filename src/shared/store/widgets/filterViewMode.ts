import { ViewMode, WidgetsState } from './types';

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
