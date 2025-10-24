import { EnrichedFilterOverview } from '@/types/domain/gpac/model';
import { Dispatch } from '@reduxjs/toolkit';
import { detachFilterTab } from '@/shared/store/slices/widgetsSlice';

/**
 * Creates a handler for detaching a filter tab
 * Responsibility: Tab lifecycle management
 */
export function createDetachTabHandler(
  dispatch: Dispatch,
  setMonitoredFilters: React.Dispatch<
    React.SetStateAction<Map<number, EnrichedFilterOverview>>
  >,
  setActiveTab: (tab: string) => void,
) {
  return (filterIdx: number, filterName: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Create detached widget
    dispatch(detachFilterTab({ filterIdx, filterName }));

    // Close tab from sidebar
    setMonitoredFilters((prev) => {
      const newMap = new Map(prev);
      newMap.delete(filterIdx);
      return newMap;
    });

    // Return to dashboard view
    setActiveTab('main');
  };
}
