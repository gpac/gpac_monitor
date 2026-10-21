import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../index';
import type { RootState as WidgetsRootState } from '../../widgets/types';
import { WidgetConfig } from '@/types/ui/widget';

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

export const makeSelectWidgetConfig = () =>
  createSelector(
    [selectWidgetConfigsInternal, (_: RootState, id: string) => id],
    (configs, id) => configs[id] ?? defaultWidgetConfig,
  );
