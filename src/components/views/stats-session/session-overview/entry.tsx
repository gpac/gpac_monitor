import React, { useMemo, useState, useRef, useCallback } from 'react';
import { useOptimizedResize } from '@/shared/hooks/useOptimizedResize';
import { useMultiFilterMonitor } from '@/components/views/stats-session/hooks/useMultiFilterMonitor';
import { useTabManagement } from '@/components/views/stats-session/hooks/useTabManagement';
import { useStatsCalculations } from '@/components/views/stats-session/hooks/useStatsCalculations';
import WidgetWrapper from '@/components/common/WidgetWrapper';
import { WidgetProps } from '@/types/ui/widget';
import { EnrichedFilterOverview } from '@/types/domain/gpac/model';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { StatsTabs } from '../tabs/SessionStatsTabs';
import { DashboardTabContent } from '../tabs/DashboardTabContent';
import {
  MonitoredFilterTabs,
  MonitoredFilterContent,
} from '../tabs/MonitoredFilterTabs';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import {
  detachFilterTab,
  selectActiveWidgets,
  setSelectedNode,
} from '@/shared/store/slices/widgetsSlice';
import { gpacService } from '@/services/gpacService';

const MultiFilterMonitor: React.FC<WidgetProps> = React.memo(
  ({ id, isDetached, detachedFilterIdx }) => {
    const dispatch = useAppDispatch();
    const activeWidgets = useAppSelector(selectActiveWidgets);
    const [activeTab, setActiveTab] = useState('main');
    const [isResizing, setIsResizing] = useState(false);
    const [monitoredFiltersState, setMonitoredFiltersState] = useState<
      Map<number, EnrichedFilterOverview>
    >(new Map());

    // Optimize complex stats calculations during resize
    const { ref } = useOptimizedResize({
      onResizeStart: () => setIsResizing(true),
      onResizeEnd: () => setIsResizing(false),
      debounce: 20, // Slightly higher for complex calculations
      throttle: true,
    }) as { ref: React.RefObject<HTMLElement> };
    const containerRef = ref as React.RefObject<HTMLDivElement>;

    // Memoize isDashboardActive to prevent unnecessary recalculations
    const isDashboardActive = useMemo(() => activeTab === 'main', [activeTab]);
    const tabsRef = useRef<HTMLDivElement>(null);

    const { isLoading, sessionStats, staticFilters } =
      useMultiFilterMonitor(isDashboardActive);

    // Skip expensive calculations during resize
    const enrichedGraphFilterCollection = useMemo(() => {
      if (staticFilters.length === 0 || isResizing) {
        return [];
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
    }, [staticFilters, sessionStats, isResizing]);

    // Use the stats calculations hook directly (it's already optimized internally)
    const { statsCounters, systemStats } = useStatsCalculations(
      staticFilters,
      sessionStats,
    );

    // Callback to create detached widget (used by dashboard card click)
    const handleCreateDetachedWidget = useCallback(
      (filterIdx: number, filterName: string) => {
        dispatch(detachFilterTab({ filterIdx, filterName }));
      },
      [dispatch],
    );

    // Use the original inline approach for useTabManagement to avoid type issues
    const { handleCardClick, handleCloseTab } = useTabManagement({
      rawFiltersFromServer: enrichedGraphFilterCollection,
      monitoredFilters: monitoredFiltersState,
      setMonitoredFilters: setMonitoredFiltersState,
      activeTab,
      setActiveTab,
      tabsRef,
      activeWidgets,
      onCreateDetachedWidget: handleCreateDetachedWidget,
    });

    // Memoize callbacks to prevent child re-renders
    const memoizedHandleCardClick = useCallback(
      (filterIndex: number) => {
        handleCardClick(filterIndex);
      },
      [handleCardClick],
    );

    const memoizedHandleCloseTab = useCallback(
      (filterIndex: number, event?: React.MouseEvent) => {
        if (event) {
          handleCloseTab(filterIndex, event);
        }
      },
      [handleCloseTab],
    );

    const handleDetachTab = useCallback(
      (filterIdx: number, filterName: string, e: React.MouseEvent) => {
        e.stopPropagation();

        // Create detached widget
        dispatch(detachFilterTab({ filterIdx, filterName }));

        // Close tab from sidebar
        setMonitoredFiltersState((prev) => {
          const newMap = new Map(prev);
          newMap.delete(filterIdx);
          return newMap;
        });

        // Return to dashboard view
        setActiveTab('main');
      },
      [dispatch, setMonitoredFiltersState, setActiveTab],
    );

    const handleOpenProperties = useCallback(
      (filter: EnrichedFilterOverview) => {
        dispatch(
          setSelectedNode({
            idx: filter.idx,
            name: filter.name,
            gpac_args: [],
          }),
        );
        gpacService.subscribeToFilterArgs(filter.idx);
      },
      [dispatch],
    );

    // DETACHED MODE: Display single filter full screen
    if (isDetached && detachedFilterIdx !== undefined) {
      const filter = enrichedGraphFilterCollection.find(
        (f) => f.idx === detachedFilterIdx,
      );

      if (isLoading) {
        return (
          <WidgetWrapper id={id}>
            <div
              className="flex items-center justify-center h-full"
              aria-busy="true"
            >
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400/60 border-t-transparent" />
            </div>
          </WidgetWrapper>
        );
      }

      if (!filter) {
        return (
          <WidgetWrapper id={id}>
            <div className="flex items-center justify-center h-full">
              <p className="text-monitor-text-muted">
                Filter {detachedFilterIdx} not found
              </p>
            </div>
          </WidgetWrapper>
        );
      }

      return (
        <WidgetWrapper id={id}>
          <div className="h-full">
            <MonitoredFilterContent
              idx={filter.idx}
              filter={filter}
              isActive={true}
              onCardClick={memoizedHandleCardClick}
              onOpenProperties={handleOpenProperties}
            />
          </div>
        </WidgetWrapper>
      );
    }

    // NORMAL MODE: multiple tabs
    if (isLoading) {
      return (
        <WidgetWrapper id={id}>
          <div
            className="flex items-center justify-center h-full"
            aria-busy="true"
          >
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400/60 border-t-transparent" />
          </div>
        </WidgetWrapper>
      );
    }

    if (staticFilters.length === 0) {
      return (
        <WidgetWrapper id={id}>
          <div className="flex flex-col items-center justify-center h-full p-4 text-monitor-text-secondary">
            <p className="text-monitor-text-primary">No filters available</p>
            <p className="text-sm mt-2 text-monitor-text-muted">
              Waiting Waiting for graph construction...
            </p>
          </div>
        </WidgetWrapper>
      );
    }

    return (
      <WidgetWrapper id={id}>
        <div
          ref={containerRef}
          className={`h-full ${isResizing ? 'contain-layout contain-style' : ''}`}
        >
          <Tabs
            value={activeTab}
            onValueChange={isResizing ? () => {} : setActiveTab}
            className="flex-1 flex flex-col"
          >
            <StatsTabs
              activeTab={activeTab}
              onValueChange={setActiveTab}
              monitoredFilters={monitoredFiltersState}
              onCloseTab={memoizedHandleCloseTab}
              onDetachTab={handleDetachTab}
              tabsRef={tabsRef}
              activeWidgets={activeWidgets}
            />

            <TabsContent
              value="main"
              className={`flex-1 p-4 ${isResizing ? 'pointer-events-none' : ''}`}
            >
              <DashboardTabContent
                systemStats={systemStats}
                statsCounters={statsCounters}
                filtersWithLiveStats={enrichedGraphFilterCollection}
                filtersMatchingCriteria={enrichedGraphFilterCollection}
                loading={isLoading || isResizing}
                monitoredFilters={monitoredFiltersState}
                onCardClick={isResizing ? () => {} : memoizedHandleCardClick}
                refreshInterval="1s"
                activeWidgets={activeWidgets}
              />
            </TabsContent>

            <MonitoredFilterTabs
              monitoredFilters={monitoredFiltersState}
              activeTab={activeTab}
              onCardClick={isResizing ? () => {} : memoizedHandleCardClick}
              onOpenProperties={handleOpenProperties}
            />
          </Tabs>
        </div>
      </WidgetWrapper>
    );
  },
);

MultiFilterMonitor.displayName = 'MultiFilterMonitor';

export default MultiFilterMonitor;
