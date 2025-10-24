import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../slices/widgetsSlice';
import { WidgetType } from '@/types/ui/widget';

/**
 * Base selector for active widgets
 */
const selectActiveWidgets = (state: RootState) => state.widgets.activeWidgets;

/**
 * Check if a filter is currently visible in a detached widget
 * Used to prevent duplicate tabs when filter already has a detached widget
 *
 * @example
 * const isDetached = useAppSelector(state =>
 *   selectIsFilterDetached(state, filterIdx)
 * );
 */
export const selectIsFilterDetached = createSelector(
  [selectActiveWidgets, (_: RootState, filterIdx: number) => filterIdx],
  (activeWidgets, filterIdx): boolean => {
    return activeWidgets.some(
      (w) =>
        w.type === WidgetType.FILTERSESSION &&
        w.isDetached === true &&
        w.detachedFilterIdx === filterIdx,
    );
  },
);

/**
 * Get the detached widget ID for a specific filter
 * Returns null if no detached widget exists for this filter
 */
export const selectDetachedWidgetByFilter = createSelector(
  [selectActiveWidgets, (_: RootState, filterIdx: number) => filterIdx],
  (activeWidgets, filterIdx): string | null => {
    const detachedWidget = activeWidgets.find(
      (w) =>
        w.type === WidgetType.FILTERSESSION &&
        w.isDetached === true &&
        w.detachedFilterIdx === filterIdx,
    );
    return detachedWidget ? detachedWidget.id : null;
  },
);

/**
 * Count all detached FILTERSESSION widgets
 */
export const selectDetachedWidgetCount = createSelector(
  [selectActiveWidgets],
  (activeWidgets): number => {
    return activeWidgets.filter(
      (w) => w.type === WidgetType.FILTERSESSION && w.isDetached === true,
    ).length;
  },
);

/**
 * Get all detached FILTERSESSION widgets with their filter indices
 */
export const selectAllDetachedWidgets = createSelector(
  [selectActiveWidgets],
  (activeWidgets) => {
    return activeWidgets.filter(
      (w) => w.type === WidgetType.FILTERSESSION && w.isDetached === true,
    );
  },
);
