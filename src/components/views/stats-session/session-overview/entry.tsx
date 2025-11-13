import React, { useMemo, useState, useRef, useCallback } from 'react';
import { useOptimizedResize } from '@/shared/hooks/useOptimizedResize';
import { useMultiFilterMonitor } from '@/components/views/stats-session/hooks/useMultiFilterMonitor';
import { useStatsCalculations } from '@/components/views/stats-session/hooks/useStatsCalculations';
import WidgetWrapper from '@/components/Widget/WidgetWrapper';
import ConnectionErrorState from '@/components/common/ConnectionErrorState';
import { WidgetProps } from '@/types/ui/widget';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { StatsTabs } from '../tabs/SessionStatsTabs';
import { DashboardTabContent } from '../tabs/DashboardTabContent';
import {
  MonitoredFilterTabs,
  MonitoredFilterContent,
} from '../tabs/MonitoredFilterTabs';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import {
  openFilterInline,
  detachFilter,
  closeFilter,
} from '@/shared/store/slices/widgetsSlice';
import { enrichFiltersWithStats } from '../utils/filterEnrichment';
import { createOpenPropertiesHandler } from '../utils/gpacArgsManagement';
import {
  deriveMonitoredFilterMap,
  deriveInlineFilterMap,
} from '../utils/monitoredFilterMaps';

const MultiFilterMonitor: React.FC<WidgetProps> = React.memo(
  ({ id, isDetached, detachedFilterIdx }) => {
    const dispatch = useAppDispatch();
    const viewByFilter = useAppSelector((state) => state.widgets.viewByFilter);
    const [activeTab, setActiveTab] = useState('main');
    const [isResizing, setIsResizing] = useState(false);

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

    // Enrich filters with stats
    const enrichedGraphFilterCollection = useMemo(() => {
      if (staticFilters.length === 0 || isResizing) {
        return [];
      }
      return enrichFiltersWithStats(staticFilters, sessionStats);
    }, [staticFilters, sessionStats, isResizing]);

    const { statsCounters, systemStats } = useStatsCalculations(
      staticFilters,
      sessionStats,
    );

    // Derive monitored filters maps
    const monitoredFilterMap = useMemo(
      () =>
        deriveMonitoredFilterMap(viewByFilter, enrichedGraphFilterCollection),
      [viewByFilter, enrichedGraphFilterCollection],
    );

    const inlineFilterMap = useMemo(
      () => deriveInlineFilterMap(monitoredFilterMap, viewByFilter),
      [monitoredFilterMap, viewByFilter],
    );

    // Handlers
    const handleCardClick = useCallback(
      (filterIdx: number) => {
        dispatch(openFilterInline(filterIdx));
        setActiveTab(`filter-${filterIdx}`);
      },
      [dispatch],
    );

    const handleDetachTab = useCallback(
      (filterIdx: number, filterName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch(detachFilter({ idx: filterIdx, name: filterName }));
        setActiveTab('main');
      },
      [dispatch],
    );

    const handleCloseTab = useCallback(
      (filterIdx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch(closeFilter(filterIdx));
        setActiveTab('main');
      },
      [dispatch],
    );

    const handleOpenProperties = useMemo(
      () => createOpenPropertiesHandler(dispatch),
      [dispatch],
    );

    if (isDetached && detachedFilterIdx !== undefined) {
      // Skip loading check for detached widgets - show data immediately
      const filter = enrichedGraphFilterCollection.find(
        (f) => f.idx === detachedFilterIdx,
      );

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
              onCardClick={handleCardClick}
              onOpenProperties={handleOpenProperties}
            />
          </div>
        </WidgetWrapper>
      );
    }

    // NORMAL MODE: multiple tabs

    if (isLoading && staticFilters.length === 0) {
      return <ConnectionErrorState id={id} isLoading={true} />;
    }

    if (!isLoading && staticFilters.length === 0) {
      return (
        <WidgetWrapper id={id}>
          <div className="flex flex-col items-center justify-center h-full p-4 text-monitor-text-secondary">
            <p className="text-monitor-text-primary">No filters available</p>
            <p className="text-sm mt-2 text-monitor-text-muted">
              Waiting for graph construction...
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
              allFilters={enrichedGraphFilterCollection}
              onCloseTab={handleCloseTab}
              onDetachTab={handleDetachTab}
              tabsRef={tabsRef}
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
                monitoredFilters={monitoredFilterMap}
                onCardClick={isResizing ? () => {} : handleCardClick}
                refreshInterval="1s"
                activeWidgets={[]}
              />
            </TabsContent>

            <MonitoredFilterTabs
              monitoredFilters={inlineFilterMap}
              activeTab={activeTab}
              onCardClick={isResizing ? () => {} : handleCardClick}
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
