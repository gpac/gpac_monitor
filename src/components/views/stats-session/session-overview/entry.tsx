import React, { useMemo, useState, useRef } from 'react';
import { useOptimizedResize } from '@/shared/hooks/useOptimizedResize';
import { useMultiFilterMonitor } from '../hooks/useMultiFilterMonitor';
import { useStatsCalculations } from '../hooks/stats';
import { useEnrichedStats } from '../hooks/stats';
import { useMonitoredFilters, useFilterHandlers } from '../hooks/filters';
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
import { enrichFiltersWithStats } from '../utils/filterEnrichment';
import RenderCount from '@/components/views/graph/ui/graph/RenderCount';

const MultiFilterMonitor: React.FC<WidgetProps> = React.memo(
  ({ id, isDetached, detachedFilterIdx }) => {
    const [activeTab, setActiveTab] = useState('main');
    const [isResizing, setIsResizing] = useState(false);
    const tabsRef = useRef<HTMLDivElement>(null);

    const { ref } = useOptimizedResize({
      onResizeStart: () => setIsResizing(true),
      onResizeEnd: () => setIsResizing(false),
      debounce: 20,
      throttle: true,
    }) as { ref: React.RefObject<HTMLElement> };
    const containerRef = ref as React.RefObject<HTMLDivElement>;

    const isDashboardActive = useMemo(() => activeTab === 'main', [activeTab]);

    const { isLoading, sessionStats, staticFilters } =
      useMultiFilterMonitor(isDashboardActive);

    // Merge static graph data with dynamic session stats
    const filtersWithSessionStats = useMemo(() => {
      if (staticFilters.length === 0 || isResizing) return [];
      return enrichFiltersWithStats(staticFilters, sessionStats);
    }, [staticFilters, sessionStats, isResizing]);

    // Add computed metrics via worker (activityLevel, sessionType, formatted values)
    const filtersWithComputedMetrics = useEnrichedStats(
      filtersWithSessionStats,
    );

    const { statsCounters, systemStats } = useStatsCalculations(
      filtersWithComputedMetrics,
      sessionStats,
    );

    const { monitoredFilterMap, inlineFilterMap } = useMonitoredFilters(
      filtersWithComputedMetrics,
    );

    const {
      handleCardClick,
      handleDetachTab,
      handleCloseTab,
      handleOpenProperties,
    } = useFilterHandlers(setActiveTab);

    if (isDetached && detachedFilterIdx !== undefined) {
      // Skip loading check for detached widgets - show data immediately
      const filter = filtersWithComputedMetrics.find(
        (f) => f.idx === detachedFilterIdx,
      );

      if (!filter) {
        return (
          <WidgetWrapper id={id}>
            <RenderCount
              componentName={`MultiFilterMonitor-Detached-${detachedFilterIdx}-NotFound`}
            />
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
          <RenderCount
            componentName={`MultiFilterMonitor-Detached-Filter-${detachedFilterIdx}`}
          />
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
        <RenderCount componentName="MultiFilterMonitor-Normal" />
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
              allFilters={filtersWithComputedMetrics}
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
                filtersWithLiveStats={filtersWithComputedMetrics}
                filtersMatchingCriteria={filtersWithComputedMetrics}
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
