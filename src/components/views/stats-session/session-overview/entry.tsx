import React, {
  useMemo,
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import { useOptimizedResize } from '@/shared/hooks/useOptimizedResize';
import { useMultiFilterMonitor } from '../hooks/useMultiFilterMonitor';
import { useStatsCalculations } from '../hooks/stats';
import { useEnrichedStats } from '../hooks/stats';
import { useMonitoredFilters, useFilterHandlers } from '../hooks/filters';
import { useAppSelector, useAppDispatch } from '@/shared/hooks/redux';
import { useSidebar } from '@/shared/hooks/useSidebar';
import { clearPendingFilterOpen } from '@/shared/store/slices/graphSlice';
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
import { getFilterIdxFromTab } from '../utils/filterMonitoringUtils';
import { Widget } from '@/types/ui/widget';

const EMPTY_ACTIVE_WIDGETS: Widget[] = [];

const MultiFilterMonitor: React.FC<WidgetProps> = React.memo(
  ({ id, isDetached, detachedFilterIdx }) => {
    // State & Refs
    const dispatch = useAppDispatch();
    const [activeTab, setActiveTab] = useState('main');
    const [isResizing, setIsResizing] = useState(false);
    const tabsRef = useRef<HTMLDivElement>(null);

    // Resize Handling
    const { ref } = useOptimizedResize({
      onResizeStart: () => setIsResizing(true),
      onResizeEnd: () => setIsResizing(false),
      debounce: 20,
      throttle: true,
    }) as { ref: React.RefObject<HTMLElement> };
    const containerRef = ref as React.RefObject<HTMLDivElement>;

    // Data Hooks (Stats & Filters)
    const isDashboardActive = useMemo(() => activeTab === 'main', [activeTab]);
    const { isLoading, sessionStats, staticFilters } =
      useMultiFilterMonitor(isDashboardActive);

    const filtersWithSessionStats = useMemo(() => {
      if (staticFilters.length === 0 || isResizing) return [];
      return enrichFiltersWithStats(staticFilters, sessionStats);
    }, [staticFilters, sessionStats, isResizing]);

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

    // User Actions
    const {
      handleCardClick,
      handleDetachTab,
      handleCloseTab,
      handleOpenProperties,
    } = useFilterHandlers(setActiveTab);

    // Sidebar Management
    const { closeSidebar, sidebarContent } = useSidebar();

    // Effects
    // Listen for pending filter open requests from NodeToolbar
    const pendingFilterOpen = useAppSelector(
      (state) => state.graph.pendingFilterOpen,
    );

    useEffect(() => {
      if (pendingFilterOpen) {
        handleCardClick(pendingFilterOpen.filterIdx);
        dispatch(clearPendingFilterOpen());
      }
    }, [pendingFilterOpen, handleCardClick, dispatch]);

    // Auto-close sidebar when switching to a different filter
    useEffect(() => {
      if (sidebarContent) {
        const currentFilterIdx = getFilterIdxFromTab(activeTab);
        if (currentFilterIdx !== sidebarContent.filterIdx) {
          closeSidebar();
        }
      }
    }, [activeTab, sidebarContent, closeSidebar]);

    // Auto-scroll to bottom when widget is detached
    useEffect(() => {
      if (isDetached) {
        requestAnimationFrame(() => {
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth',
          });
        });
      }
    }, [isDetached]);
    // Resize Optimization
    // Disable callbacks during resize to avoid expensive re-renders
    const noopTabChange = useCallback(() => {}, []);
    const noopCardClick = useCallback(() => {}, []);
    const safeOnTabChange = isResizing ? noopTabChange : setActiveTab;
    const safeOnCardClick = isResizing ? noopCardClick : handleCardClick;

    // Detached Mode (Overlay Widget)

    if (isDetached && detachedFilterIdx !== undefined) {
      const filter = filtersWithComputedMetrics.find(
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

    // Loading State
    if (isLoading && staticFilters.length === 0) {
      return <ConnectionErrorState id={id} isLoading={true} />;
    }
    // Empty State
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
    // Main UI (
    return (
      <WidgetWrapper id={id}>
        <div
          ref={containerRef}
          className={`h-full ${isResizing ? 'contain-layout contain-style' : ''}`}
        >
          <Tabs
            value={activeTab}
            onValueChange={safeOnTabChange}
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
                onCardClick={safeOnCardClick}
                refreshInterval="1s"
                activeWidgets={EMPTY_ACTIVE_WIDGETS}
              />
            </TabsContent>

            <MonitoredFilterTabs
              monitoredFilters={inlineFilterMap}
              activeTab={activeTab}
              onCardClick={safeOnCardClick}
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
