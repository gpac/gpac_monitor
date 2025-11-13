import { Widget, WidgetType } from '@/types/ui/widget';
import { EnrichedFilterOverview } from '@/types/domain/gpac/model';

/**
 * Check if a filter is currently detached (displayed in separate widget)
 */
export const isFilterDetached = (
  filterIdx: number,
  activeWidgets: Widget[],
): boolean => {
  return activeWidgets.some(
    (w) =>
      w.type === WidgetType.FILTERSESSION &&
      w.isDetached === true &&
      w.detachedFilterIdx === filterIdx,
  );
};

/**
 * Check if a filter is currently monitored (inline tab view)
 */
export const isFilterMonitored = (
  filterIdx: number,
  monitoredFilters: Map<number, EnrichedFilterOverview>,
): boolean => {
  return monitoredFilters.has(filterIdx);
};
