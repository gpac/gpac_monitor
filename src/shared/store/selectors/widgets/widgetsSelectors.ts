import { createSelector } from '@reduxjs/toolkit';
import { shallowEqual } from 'react-redux';
import type { RootState } from '../../index';
import type {
  OpenPreviews,
  RootState as WidgetsRootState,
  ViewMode,
} from '../../widgets/types';
import { WidgetConfig } from '@/types/ui/widget';
import type { InitialTabType } from '@/shared/store/slices/graphSlice';
import type { PIDMetricMode } from '@/components/views/stats-session/types/pid';
import type { GraphInputPid, GraphOutputPid } from '@/types/domain/gpac/model';
import { GpacStreamType } from '@/types/domain/gpac/stream-types';

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

const NO_OPEN_PREVIEWS: OpenPreviews = { input: [], output: [] };

export const selectFilterOpenPreviews = (
  state: WidgetsRootState,
  filterIdx: number,
): OpenPreviews =>
  state.widgets.viewByFilter[filterIdx]?.openPreviews ?? NO_OPEN_PREVIEWS;

export interface PreviewSourcePid {
  direction: keyof OpenPreviews;
  pidIdx: number;
  name: string;
  isOpen: boolean;
}

export interface PreviewSourceGroup {
  filterIdx: number;
  filterName: string;
  pids: PreviewSourcePid[];
}

const selectGraphFilters = (state: RootState) => state.graph.filters;

const toVisualSourcePids = (
  direction: keyof OpenPreviews,
  graphPids: (GraphInputPid | GraphOutputPid)[],
  openPreviews: OpenPreviews,
): PreviewSourcePid[] =>
  graphPids
    .filter((pid) => pid.stream_type === GpacStreamType.Visual)
    .map((pid) => ({
      direction,
      pidIdx: pid.pid_index,
      name: pid.name,
      isOpen: openPreviews[direction].includes(pid.pid_index),
    }));

export const selectPreviewSources = createSelector(
  [selectGraphFilters, selectViewByFilter],
  (filters, viewByFilter): PreviewSourceGroup[] =>
    filters.flatMap((filter) => {
      const openPreviews =
        viewByFilter[filter.idx]?.openPreviews ?? NO_OPEN_PREVIEWS;
      const pids = [
        ...toVisualSourcePids('input', filter.ipid, openPreviews),
        ...toVisualSourcePids('output', filter.opid, openPreviews),
      ];
      return pids.length > 0
        ? [{ filterIdx: filter.idx, filterName: filter.name, pids }]
        : [];
    }),
);

export const makeSelectWidgetConfig = () =>
  createSelector(
    [selectWidgetConfigsInternal, (_: RootState, id: string) => id],
    (configs, id) => configs[id] ?? defaultWidgetConfig,
  );
