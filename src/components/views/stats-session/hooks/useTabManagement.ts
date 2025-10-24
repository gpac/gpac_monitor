import type { EnrichedFilterOverview } from '@/types/domain/gpac/model';
import { useCallback } from 'react';
import { Widget, WidgetType } from '@/types/ui/widget';

interface UseTabManagementProps {
  rawFiltersFromServer: EnrichedFilterOverview[];
  monitoredFilters: Map<number, EnrichedFilterOverview>;
  setMonitoredFilters: React.Dispatch<
    React.SetStateAction<Map<number, EnrichedFilterOverview>>
  >;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  tabsRef: React.RefObject<HTMLDivElement>;
  activeWidgets: Widget[];
  onCreateDetachedWidget: (filterIdx: number, filterName: string) => void;
}

export const useTabManagement = ({
  rawFiltersFromServer,
  setMonitoredFilters,
  activeTab,
  setActiveTab,
  tabsRef,
  activeWidgets,
  onCreateDetachedWidget,
}: UseTabManagementProps) => {
  const handleCardClick = useCallback(
    (idx: number) => {
      // Handle "Back" button click (idx = -1)
      if (idx === -1) {
        setActiveTab('main');
        setTimeout(() => {
          const mainTabElement = tabsRef.current?.querySelector(
            '[data-value="main"]',
          ) as HTMLButtonElement;
          if (mainTabElement) {
            mainTabElement.click();
          }
        }, 0);
        return;
      }

      // Check if filter already has a detached widget
      const isAlreadyDetached = activeWidgets.some(
        (w) =>
          w.type === WidgetType.FILTERSESSION &&
          w.isDetached === true &&
          w.detachedFilterIdx === idx,
      );

      if (isAlreadyDetached) {
        // Filter already visible in detached view, ignore
        return;
      }

      // Find filter and create detached widget
      const filter = rawFiltersFromServer.find((f) => f.idx === idx);
      if (filter) {
        onCreateDetachedWidget(idx, filter.name);
      }
    },
    [
      setActiveTab,
      tabsRef,
      rawFiltersFromServer,
      activeWidgets,
      onCreateDetachedWidget,
    ],
  );

  const handleCloseTab = useCallback(
    (idx: number, e: React.MouseEvent) => {
      e.stopPropagation();
      setMonitoredFilters((prev) => {
        const newMap = new Map(prev);
        newMap.delete(idx);
        return newMap;
      });
      setTimeout(() => {
        if (activeTab === `filter-${idx}`) {
          const mainTabElement = tabsRef.current?.querySelector(
            '[data-value="main"]',
          ) as HTMLButtonElement;
          if (mainTabElement) {
            mainTabElement.click();
          }
        }
      }, 0);
      if (activeTab === `filter-${idx}`) {
        setActiveTab('main');
      }
    },
    [activeTab, setActiveTab, setMonitoredFilters, tabsRef],
  );

  return { handleCardClick, handleCloseTab };
};
