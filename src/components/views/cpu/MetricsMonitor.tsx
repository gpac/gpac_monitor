import React, { useState, useDeferredValue, useMemo, useCallback } from 'react';
import { useOptimizedResize } from '@/shared/hooks/useOptimizedResize';

import { CPUChart } from './components/CPUChart';
import { CPUOverview } from './components/CPUOverview';
import { LiveToggle } from './components/LiveToggle';
import { MemoryChart } from './components/MemoryChart';
import { useCPUStats } from './hooks/useCPUStats';
import WidgetWrapper from '@/components/common/WidgetWrapper';

// Static CSS classes extracted to prevent recreation on every render
const BASE_CONTAINER_CLASS = 'container mx-auto space-y-4 p-4';
const RESIZING_CLASS = 'contain-layout contain-style';
const BASE_GRID_CLASS = 'grid grid-cols-1 gap-4 lg:grid-cols-2';
const GRID_RESIZING_CLASS = 'pointer-events-none';

interface MetricsMonitorProps {
  id: string;
  title: string;
}

const MetricsMonitor: React.FC<MetricsMonitorProps> = React.memo(
  ({ id, title }) => {
    const [isLive, setIsLive] = useState(true);
    const [isResizing, setIsResizing] = useState(false);

    // Optimize resize performance
    const { ref } = useOptimizedResize({
      onResizeStart: () => setIsResizing(true),
      onResizeEnd: () => setIsResizing(false),
      debounce: 16,
      throttle: true,
    }) as { ref: React.RefObject<HTMLElement> };
    const containerRef = ref as React.RefObject<HTMLDivElement>;

    // Collecte des données à 150ms (throttlé à 500ms dans le messageHandler)
    const { stats, isSubscribed } = useCPUStats(isLive, 150);

    const deferredStats = useDeferredValue(stats);
    const deferredSubscribed = useDeferredValue(isSubscribed);

    // Memoize current stats calculation to avoid recalculating on every render
    const currentStats = useMemo(() => {
      return deferredStats.length > 0
        ? deferredStats[deferredStats.length - 1]
        : null;
    }, [deferredStats]);

    // Memoize derived values to avoid recalculation
    const metricsValues = useMemo(
      () => ({
        currentCPUPercent: currentStats?.process_cpu_usage || 0,
        currentMemoryPercent: currentStats?.process_memory_percent || 0,
        currentMemoryProcess: currentStats?.process_memory || 0,
        totalCores: currentStats?.nb_cores || 0,
        isLoading: !deferredSubscribed,
      }),
      [currentStats, deferredSubscribed],
    );

    // Memoize the toggle callback to prevent child re-renders
    const handleToggleLive = useCallback((newIsLive: boolean) => {
      setIsLive(newIsLive);
    }, []);

    // Memoize className strings to prevent recreation on every render
    const containerClassName = useMemo(
      () => `${BASE_CONTAINER_CLASS}${isResizing ? ` ${RESIZING_CLASS}` : ''}`,
      [isResizing],
    );

    const gridClassName = useMemo(
      () => `${BASE_GRID_CLASS}${isResizing ? ` ${GRID_RESIZING_CLASS}` : ''}`,
      [isResizing],
    );

    // Memoize live state for chart components
    const chartLiveState = useMemo(
      () => isLive && !isResizing,
      [isLive, isResizing],
    );

    return (
      <WidgetWrapper id={id} title={title}>
        <div ref={containerRef} className={containerClassName}>
          <div className="flex items-center justify-items-start">
            <LiveToggle isLive={isLive} onToggle={handleToggleLive} />
          </div>

          <div className="w-full">
            <CPUOverview
              cpuUsage={metricsValues.currentCPUPercent}
              memoryProcess={metricsValues.currentMemoryProcess}
              totalCores={metricsValues.totalCores}
              isLoading={metricsValues.isLoading}
            />
          </div>

          <div className={gridClassName}>
            <CPUChart
              currentCPUPercent={metricsValues.currentCPUPercent}
              isLive={chartLiveState}
            />
            <MemoryChart
              currentMemoryPercent={metricsValues.currentMemoryPercent}
              currentMemoryProcess={metricsValues.currentMemoryProcess}
              isLive={chartLiveState}
            />
          </div>
        </div>
      </WidgetWrapper>
    );
  },
);

MetricsMonitor.displayName = 'MetricsMonitor';

export default MetricsMonitor;
