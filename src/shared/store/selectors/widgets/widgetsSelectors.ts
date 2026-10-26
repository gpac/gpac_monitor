import { createSelector } from '@reduxjs/toolkit';
import { shallowEqual } from 'react-redux';
import type { RootState } from '../../index';
import type {
  RootState as WidgetsRootState,
  ViewMode,
} from '../../widgets/types';
import { WidgetConfig } from '@/types/ui/widget';
import type { InitialTabType } from '@/shared/store/slices/graphSlice';
import type { PIDMetricMode } from '@/components/views/stats-session/types/pid';

const defaultWidgetConfig: WidgetConfig = {
  isMaximized: false,
  isMinimized: false,
  settings: {},
};

/**
 * Base selector for active widgets
 */
export const selectActiveWidgets = (state: RootState) =>
  state.widgets.activeWidgets;

/**
 * Base selector for saved layouts
 */
export const selectSavedLayouts = (state: RootState) =>
  state.widgets.savedLayouts;

/**
 * Base selector for current active layout name
 */
export const selectCurrentLayout = (state: RootState): string | undefined =>
  state.widgets.currentLayout;

/**
 * Get widget config by ID
 */
const selectWidgetConfigsInternal = (state: RootState) => state.widgets.configs;

const selectViewByFilter = (state: WidgetsRootState) =>
  state.widgets.viewByFilter;

export const selectHasMonitoredFilter = createSelector(
  [selectViewByFilter],
  (viewByFilter): boolean =>
    Object.values(viewByFilter).some((view) => view !== undefined),
);

export const selectFilterViewModes = createSelector(
  [selectViewByFilter],
  (viewByFilter): Record<number, ViewMode> => {
    const viewModes: Record<number, ViewMode> = {};
    for (const [filterIdx, view] of Object.entries(viewByFilter)) {
      if (view) viewModes[Number(filterIdx)] = view.mode;
    }
    return viewModes;
  },
  { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

export const selectFilterActiveTab = (
  state: WidgetsRootState,
  filterIdx: number,
): InitialTabType =>
  state.widgets.viewByFilter[filterIdx]?.activeTab ?? 'overview';

export const selectFilterPidMetricMode = (
  state: WidgetsRootState,
  filterIdx: number,
): PIDMetricMode =>
  state.widgets.viewByFilter[filterIdx]?.pidMetricMode ?? 'bitrate';

export const makeSelectWidgetConfig = () =>
  createSelector(
    [selectWidgetConfigsInternal, (_: RootState, id: string) => id],
    (configs, id) => configs[id] ?? defaultWidgetConfig,
  );
