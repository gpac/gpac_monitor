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

/** Extract filterIdx from activeTab (e.g., "filter-0" → 0, "main" → null) */
export const getFilterIdxFromTab = (activeTab: string): number | null => {
  return activeTab.startsWith('filter-')
    ? parseInt(activeTab.replace('filter-', ''), 10)
    : null;
};
