import type { EnrichedFilterOverview } from '@/types/domain/gpac/model';
import { useCallback } from 'react';

interface UseTabManagementProps {
  rawFiltersFromServer: EnrichedFilterOverview[];
  monitoredFilters: Map<number, EnrichedFilterOverview>;
  setMonitoredFilters: React.Dispatch<
    React.SetStateAction<Map<number, EnrichedFilterOverview>>
  >;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  tabsRef: React.RefObject<HTMLDivElement>;
}

export const useTabManagement = ({
  rawFiltersFromServer,
  monitoredFilters,
  setMonitoredFilters,
  activeTab,
  setActiveTab,
  tabsRef,
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

      if (monitoredFilters.has(idx)) {
        setActiveTab(`filter-${idx}`);
        setTimeout(() => {
          const tabElement = tabsRef.current?.querySelector(
            `[data-value="filter-${idx}"]`,
          ) as HTMLButtonElement;
          if (tabElement) {
            tabElement.click();
          }
        }, 0);
      } else {
        const filter = rawFiltersFromServer.find((f) => f.idx === idx);
        if (filter) {
          setMonitoredFilters((prev) => {
            const newMap = new Map(prev);
            newMap.set(idx, filter);
            return newMap;
          });
          setTimeout(() => {
            setActiveTab(`filter-${idx}`);
          }, 0);
        }
      }
    },
    [
      monitoredFilters,
      setActiveTab,
      setMonitoredFilters,
      tabsRef,
      rawFiltersFromServer,
      activeTab,
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
