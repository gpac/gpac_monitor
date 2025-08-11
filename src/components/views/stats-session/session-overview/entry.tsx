import React, { useMemo, useState, useRef, useCallback } from 'react';
import { useMultiFilterMonitor } from '@/components/views/stats-session/hooks/useMultiFilterMonitor';
import { useTabManagement } from '@/components/views/stats-session/hooks/useTabManagement';
import { useStatsCalculations } from '@/components/views/stats-session/hooks/useStatsCalculations';
import WidgetWrapper from '@/components/common/WidgetWrapper';
import { WidgetProps } from '@/types/ui/widget';
import { EnrichedFilterOverview } from '@/types/domain/gpac/model';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { StatsTabs } from '../tabs/SessionStatsTabs';
import { DashboardTabContent } from '../tabs/DashboardTabContent';
import { MonitoredFilterTabs } from '../tabs/MonitoredFilterTabs';

const MultiFilterMonitor: React.FC<WidgetProps> = React.memo(
  ({ id, title }) => {
    const [activeTab, setActiveTab] = useState('main');
    const [monitoredFiltersState, setMonitoredFiltersState] = useState<
      Map<number, EnrichedFilterOverview>
    >(new Map());
    
    // Memoize isDashboardActive to prevent unnecessary recalculations
    const isDashboardActive = useMemo(() => activeTab === 'main', [activeTab]);
    const tabsRef = useRef<HTMLDivElement>(null);

    const { isLoading, sessionStats, staticFilters } =
      useMultiFilterMonitor(isDashboardActive);

    // Optimize the enriched filter collection with stable keys and memoization
    const enrichedGraphFilterCollection = useMemo(() => {
      if (staticFilters.length === 0) {
        return []; // Return empty array if no data to avoid expensive operations
      }
      
      return staticFilters.map((staticFilter): EnrichedFilterOverview => {
        const dynamicStats = sessionStats.find(
          (stat) => stat.idx === staticFilter.idx,
        );
        return {
          ...staticFilter,
          ipid: Object.fromEntries(
            Object.entries(staticFilter.ipid).map(([key, value]) => [
              key,
              { ...value, buffer: 0, buffer_total: 0 },
            ]),
          ),
          opid: Object.fromEntries(
            Object.entries(staticFilter.opid).map(([key, value]) => [
              key,
              { ...value, buffer: 0, buffer_total: 0 },
            ]),
          ),
          status: dynamicStats?.status || staticFilter.status,
          bytes_done: dynamicStats?.bytes_done || 0,
          bytes_sent: dynamicStats?.bytes_sent || 0,
          pck_done: dynamicStats?.pck_done || 0,
          pck_sent: dynamicStats?.pck_sent || 0,
          time: dynamicStats?.time || 0,
          tasks: 0,
          errors: 0,
        };
      });
    }, [staticFilters, sessionStats]);

    // Use the stats calculations hook directly (it's already optimized internally)
    const { statsCounters, systemStats } = useStatsCalculations(
      staticFilters,
      sessionStats,
    );

    // Use the original inline approach for useTabManagement to avoid type issues
    const { handleCardClick, handleCloseTab } = useTabManagement({
      rawFiltersFromServer: enrichedGraphFilterCollection,
      monitoredFilters: monitoredFiltersState,
      setMonitoredFilters: setMonitoredFiltersState,
      activeTab,
      setActiveTab,
      tabsRef,
    });

    // Memoize callbacks to prevent child re-renders
    const memoizedHandleCardClick = useCallback((filterIndex: number) => {
      handleCardClick(filterIndex);
    }, [handleCardClick]);

    const memoizedHandleCloseTab = useCallback((filterIndex: number, event?: React.MouseEvent) => {
      if (event) {
        handleCloseTab(filterIndex, event);
      }
    }, [handleCloseTab]);

    if (isLoading) {
      return (
        <WidgetWrapper id={id} title={title}>
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        </WidgetWrapper>
      );
    }

    if (staticFilters.length === 0) {
      return (
        <WidgetWrapper id={id} title={title}>
          <div className="flex flex-col items-center justify-center h-full p-4 text-gray-400">
            <p>No filters available</p>
            <p className="text-sm mt-2">
              Waiting Waiting for graph construction...
            </p>
          </div>
        </WidgetWrapper>
      );
    }

    return (
      <WidgetWrapper id={id} title="Session filters overview  ">
        <div className="h-full">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col"
          >
            <StatsTabs
              activeTab={activeTab}
              onValueChange={setActiveTab}
              monitoredFilters={monitoredFiltersState}
              onCloseTab={memoizedHandleCloseTab}
              tabsRef={tabsRef}
            />

            <TabsContent value="main" className="flex-1 p-4">
              <DashboardTabContent
                systemStats={systemStats}
                statsCounters={statsCounters}
                filtersWithLiveStats={enrichedGraphFilterCollection}
                filtersMatchingCriteria={enrichedGraphFilterCollection}
                loading={isLoading}
                monitoredFilters={monitoredFiltersState}
                onCardClick={memoizedHandleCardClick}
                refreshInterval="1s"
              />
            </TabsContent>

            <MonitoredFilterTabs
              monitoredFilters={monitoredFiltersState}
              activeTab={activeTab}
              onCardClick={memoizedHandleCardClick}
            />
          </Tabs>
        </div>
      </WidgetWrapper>
    );
  },
);

MultiFilterMonitor.displayName = 'MultiFilterMonitor';

export default MultiFilterMonitor;
