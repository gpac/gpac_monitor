import React, { useMemo } from 'react';
import { EnrichedFilterOverview } from '@/types/domain/gpac/model';
import { TabsContent } from '@/components/ui/tabs';
import { FilterTabContent } from './FilterTabContent';
import { transformFilterToTabsData } from '@/utils/filterDataTransforms';
import { useFilterStats } from '@/components/views/stats-session/hooks/useFilterStats';

interface MonitoredFilterTabsProps {
  monitoredFilters: Map<number, EnrichedFilterOverview>;
  activeTab: string;
  onCardClick: (idx: number) => void;
}

export const MonitoredFilterTabs: React.FC<MonitoredFilterTabsProps> = ({
  monitoredFilters,
  activeTab,
  onCardClick,
}) => {
  return (
    <>
      {Array.from(monitoredFilters.entries()).map(([idx, filter]) => {
        const isActive = activeTab === `filter-${idx}`;
        
        return (
          <MonitoredFilterTab
            key={`filter-${idx}`}
            idx={idx}
            filter={filter}
            isActive={isActive}
            onCardClick={onCardClick}
          />
        );
      })}
    </>
  );
};

interface MonitoredFilterTabProps {
  idx: number;
  filter: EnrichedFilterOverview;
  isActive: boolean;
  onCardClick: (idx: number) => void;
}

const MonitoredFilterTab: React.FC<MonitoredFilterTabProps> = ({
  idx,
  filter,
  isActive,
  onCardClick,
}) => {
  // Subscribe to live stats when tab is active
  const { stats } = useFilterStats(filter.idx, isActive, 1000);

  // Merge static filter data with live stats
  const filterWithStats = useMemo(
    () => ({ ...filter, ...stats }),
    [filter, stats],
  );

  const tabsData = useMemo(
    () => transformFilterToTabsData(filterWithStats),
    [filterWithStats],
  );

  return (
    <TabsContent
      value={`filter-${idx}`}
      className="flex-1"
    >
      <FilterTabContent
        {...tabsData}
        onCardClick={onCardClick}
        isMonitored={true}
      />
    </TabsContent>
  );
};