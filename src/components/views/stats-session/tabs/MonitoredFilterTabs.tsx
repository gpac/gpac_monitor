import React, { useMemo, useEffect, useRef } from 'react';
import { EnrichedFilterOverview } from '@/types/domain/gpac/model';
import { TabsContent } from '@/components/ui/tabs';
import { FilterTabContent } from '../monitored_filters/tabs/FilterTabContent';
import { useFilterStats } from '@/components/views/stats-session/hooks/stats';
import { useAppDispatch } from '@/shared/hooks/redux';
import { clearInitialTab } from '@/shared/store/slices/graphSlice';
import { store } from '@/shared/store';
import {
  FilterStatsResponse,
  PIDproperties,
} from '@/types/domain/gpac/filter-stats';

interface MonitoredFilterTabsProps {
  monitoredFilters: Map<number, EnrichedFilterOverview>;
  activeTab: string;
  onCardClick: (idx: number) => void;
  onOpenProperties: (filter: EnrichedFilterOverview) => void;
}

export const MonitoredFilterTabs: React.FC<MonitoredFilterTabsProps> = ({
  monitoredFilters,
  activeTab,
  onCardClick,
  onOpenProperties,
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
            onOpenProperties={onOpenProperties}
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
  onOpenProperties: (filter: EnrichedFilterOverview) => void;
}

// Internal component without TabsContent wrapper (for detached mode)
export const MonitoredFilterContent: React.FC<MonitoredFilterTabProps> = ({
  filter,
  isActive,
  onCardClick,
  onOpenProperties,
}) => {
  const dispatch = useAppDispatch();

  // Capture initialTab once on mount (no re-renders on change)
  const initialTabRef = useRef(store.getState().graph.initialTab);

  // Clear initialTab after capturing it (one-time use)
  useEffect(() => {
    if (initialTabRef.current) {
      dispatch(clearInitialTab());
    }
  }, [dispatch]);

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
  }, [filterWithStats, stats]);

  const handleBack = () => {
    // Navigate back to the main dashboard view
    onCardClick(-1); // Special value to indicate going back to dashboard
  };

  const handleOpenProperties = () => {
    onOpenProperties(filter);
  };

  return (
    <div className="flex-1 p-4">
      <FilterTabContent
        {...tabsData}
        filterData={stats as any}
        onBack={handleBack}
        onOpenProperties={handleOpenProperties}
        initialTab={initialTabRef.current || undefined}
      />
    </div>
  );
};

export const MonitoredFilterTab: React.FC<MonitoredFilterTabProps> = (
  props,
) => {
  return (
    <TabsContent value={`filter-${props.idx}`} className="flex-1 p-4">
      <MonitoredFilterContent {...props} />
    </TabsContent>
  );
};
