import React, { useState, useMemo } from 'react';
import { useOptimizedResize } from '@/shared/hooks/useOptimizedResize';

import { CpuMemoryChartUplot } from './components/CpuMemoryChartUplot';
import { CpuMemoryOverview } from './components/CpuMemoryOverview';
import { useCPUStats } from './hooks/useCPUStats';
import WidgetWrapper from '@/components/Widget/WidgetWrapper';
import { CPUHistoryBadge } from './components/CPUHistoryBadge';
import { useChartDuration } from './hooks/useChartDuration';
import RenderCount from '@/components/views/graph/ui/graph/RenderCount';
import {
  CHART_CPU_UPDATE_INTERVAL,
  DEFAULT_CPU_HISTORY,
  CPU_HISTORY_STORAGE_KEY,
} from './constants';

const BASE_CONTAINER_CLASS = 'container mx-auto space-y-2 p-2';
const RESIZING_CLASS = 'contain-layout contain-style';

interface MetricsMonitorProps {
  id: string;
}

const MetricsMonitor: React.FC<MetricsMonitorProps> = React.memo(({ id }) => {
  const [isLive, _setIsLive] = useState(true);
  const [isResizing, setIsResizing] = useState(false);

  // Chart duration management (encapsulated logic)
  const { duration, setDuration, windowDuration, maxPoints } = useChartDuration(
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

  const { isSubscribed, currentCPU, currentMemory, totalCores } = useCPUStats(
    isLive,
    CHART_CPU_UPDATE_INTERVAL,
  );

  const metricsValues = useMemo(
    () => ({
      currentCPUPercent: currentCPU,
      currentMemoryPercent: 0, // Not used, keeping for compatibility
      currentMemoryProcess: currentMemory,
      totalCores,
      isLoading: !isSubscribed,
    }),
    [currentCPU, currentMemory, totalCores, isSubscribed],
  );

  const containerClassName = useMemo(
    () => `${BASE_CONTAINER_CLASS}${isResizing ? ` ${RESIZING_CLASS}` : ''}`,
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
    <WidgetWrapper id={id} statusBadge={statusBadge}>
      <RenderCount componentName="MetricsMonitor" />
      <div ref={containerRef} className={containerClassName}>
        <div className="w-full">
          <CpuMemoryOverview
            cpuUsage={metricsValues.currentCPUPercent}
            memoryBytes={metricsValues.currentMemoryProcess}
            totalCores={metricsValues.totalCores}
            isLoading={metricsValues.isLoading}
          />
        </div>

        <div className="w-full">
          <CpuMemoryChartUplot
            currentCPUPercent={metricsValues.currentCPUPercent}
            currentMemoryBytes={metricsValues.currentMemoryProcess}
            isLive={chartLiveState}
            maxPoints={maxPoints}
            windowDuration={windowDuration}
          />
        </div>
      </div>
    </WidgetWrapper>
  );
});

MetricsMonitor.displayName = 'MetricsMonitor';

export default MetricsMonitor;
