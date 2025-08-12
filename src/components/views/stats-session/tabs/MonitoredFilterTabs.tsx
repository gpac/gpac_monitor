import React, { useMemo } from 'react';
import { EnrichedFilterOverview } from '@/types/domain/gpac/model';
import { TabsContent } from '@/components/ui/tabs';
import { FilterTabContent } from '../monitored_filters/tabs/FilterTabContent';
import { useFilterStats } from '@/components/views/stats-session/hooks/useFilterStats';
import {
  FilterStatsResponse,
  PIDproperties,
} from '@/types/domain/gpac/filter-stats';

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

  // Extract real data directly from filterWithStats
  const tabsData = useMemo(() => {
    return {
      overviewData: {
        idx: filterWithStats.idx,
        name: filterWithStats.name,
        type: filterWithStats.type,
        status: filterWithStats.status,
        time: filterWithStats.time,
        pck_done: filterWithStats.pck_done,
        pck_sent: filterWithStats.pck_sent,
        bytes_done: filterWithStats.bytes_done,
        bytes_sent: filterWithStats.bytes_sent,
        nb_ipid: filterWithStats.nb_ipid,
        nb_opid: filterWithStats.nb_opid,
      },
      networkData: {
        bytesSent: filterWithStats.bytes_sent || 0,
        bytesReceived: filterWithStats.bytes_done || 0,
        packetsSent: filterWithStats.pck_sent || 0,
        packetsReceived: filterWithStats.pck_done || 0,
      },
      buffersData: {
        name: filterWithStats.name,
        inputBuffers: [],
        totalBufferInfo: { totalBuffer: 0, totalCapacity: 0, averageUsage: 0 },
      },
      inputPids: (stats as FilterStatsResponse)?.ipids
        ? Object.values(
            (stats as FilterStatsResponse).ipids as Record<
              string,
              PIDproperties
            >,
          )
        : [],
      outputPids: (stats as FilterStatsResponse)?.opids
        ? Object.values(
            (stats as FilterStatsResponse).opids as Record<
              string,
              PIDproperties
            >,
          )
        : [],
    };
  }, [filterWithStats]);

  const handleBack = () => {
    // Navigate back to the main dashboard view
    onCardClick(-1); // Special value to indicate going back to dashboard
  };

  return (
    <TabsContent value={`filter-${idx}`} className="flex-1 p-4">
      <FilterTabContent
        {...tabsData}
        filterData={stats as any} // Convert MonitoredFilterStats to FilterStatsResponse
        onBack={handleBack}
      />
    </TabsContent>
  );
};
