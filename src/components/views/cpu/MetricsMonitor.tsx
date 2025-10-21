import React, { useState, useDeferredValue, useMemo } from 'react';
import { useOptimizedResize } from '@/shared/hooks/useOptimizedResize';

import { CPUChart } from './components/CPUChart';
import { CPUOverview } from './components/CPUOverview';

import { MemoryChart } from './components/MemoryChart';
import { useCPUStats } from './hooks/useCPUStats';
import WidgetWrapper from '@/components/common/WidgetWrapper';
import { CPUHistoryBadge } from './components/CPUHistoryBadge';
import { useChartDuration } from './hooks/useChartDuration';
import {
  CHART_CPU_UPDATE_INTERVAL,
  DEFAULT_CPU_HISTORY,
  CPU_HISTORY_STORAGE_KEY,
} from './constants';

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
    const [isLive, _setIsLive] = useState(true);
    const [isResizing, setIsResizing] = useState(false);

    // Chart duration management (encapsulated logic)
    const { duration, setDuration, windowDuration, maxPoints } =
      useChartDuration(
        CPU_HISTORY_STORAGE_KEY,
        DEFAULT_CPU_HISTORY,
        CHART_CPU_UPDATE_INTERVAL,
      );

    // Optimize resize performance
    const { ref } = useOptimizedResize({
      onResizeStart: () => setIsResizing(true),
      onResizeEnd: () => setIsResizing(false),
      debounce: 16,
      throttle: true,
    }) as { ref: React.RefObject<HTMLElement> };
    const containerRef = ref as React.RefObject<HTMLDivElement>;

    const { stats, isSubscribed } = useCPUStats(
      isLive,
      CHART_CPU_UPDATE_INTERVAL,
    );

    const deferredStats = useDeferredValue(stats);
    const deferredSubscribed = useDeferredValue(isSubscribed);

    // Memoize current stats calculation
    const currentStats = useMemo(() => {
      return deferredStats.length > 0
        ? deferredStats[deferredStats.length - 1]
        : null;
    }, [deferredStats]);

    // Memoize derived values
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

    const containerClassName = useMemo(
      () => `${BASE_CONTAINER_CLASS}${isResizing ? ` ${RESIZING_CLASS}` : ''}`,
      [isResizing],
    );

    const gridClassName = useMemo(
      () => `${BASE_GRID_CLASS}${isResizing ? ` ${GRID_RESIZING_CLASS}` : ''}`,
      [isResizing],
    );

    const chartLiveState = useMemo(
      () => isLive && !isResizing,
      [isLive, isResizing],
    );

    const statusBadge = useMemo(
      () => <CPUHistoryBadge value={duration} onChange={setDuration} />,
      [duration, setDuration],
    );

    return (
      <WidgetWrapper id={id} title={title} statusBadge={statusBadge}>
        <div ref={containerRef} className={containerClassName}>
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
              maxPoints={maxPoints}
              windowDuration={windowDuration}
            />
            <MemoryChart
              currentMemoryPercent={metricsValues.currentMemoryPercent}
              currentMemoryProcess={metricsValues.currentMemoryProcess}
              isLive={chartLiveState}
              /*  maxPoints={maxPoints} */
            />
          </div>
        </div>
      </WidgetWrapper>
    );
  },
);

MetricsMonitor.displayName = 'MetricsMonitor';

export default MetricsMonitor;
