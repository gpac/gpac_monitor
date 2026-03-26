import React, { useState, useMemo } from 'react';
import { useOptimizedResize } from '@/shared/hooks/useOptimizedResize';
import { useDataMode } from '@/shared/hooks/useDataMode';

import { CpuMemoryChartUplot } from './components/CpuMemoryChartUplot';
import { CpuMemoryOverview } from './components/CpuMemoryOverview';
import { useCPUStats } from './hooks/useCPUStats';
import WidgetWrapper from '@/components/widget/WidgetWrapper';
import { CPUHistoryBadge } from './components/CPUHistoryBadge';
import { useChartDuration } from './hooks/useChartDuration';
import {
  CPU_SERVER_INTERVAL,
  DEFAULT_CPU_HISTORY,
  CPU_HISTORY_STORAGE_KEY,
} from './constants';

const BASE_CONTAINER_CLASS = 'container mx-auto flex flex-col gap-2 p-2 h-full';
const RESIZING_CLASS = 'contain-layout contain-style';

interface MetricsMonitorProps {
  id: string;
}

const MetricsMonitor: React.FC<MetricsMonitorProps> = React.memo(({ id }) => {
  const [isResizing, setIsResizing] = useState(false);

  // Chart duration management
  const { duration, setDuration, windowDuration, maxPoints } = useChartDuration(
    CPU_HISTORY_STORAGE_KEY,
    DEFAULT_CPU_HISTORY,
    CPU_SERVER_INTERVAL,
  );

  // Optimize resize performance
  const { ref } = useOptimizedResize({
    onResizeStart: () => setIsResizing(true),
    onResizeEnd: () => setIsResizing(false),
    debounce: 16,
    throttle: true,
  }) as { ref: React.RefObject<HTMLElement> };
  const containerRef = ref as React.RefObject<HTMLDivElement>;

  const { isHistory } = useDataMode();

  // In history mode: unlimited buffer to show full session; live mode: respect user-selected duration
  const bufferMaxPoints = isHistory ? Infinity : maxPoints;
  const { isSubscribed, currentCPU, currentMemory, totalCores, stats } =
    useCPUStats(true, bufferMaxPoints);

  const metricsValues = useMemo(
    () => ({
      currentCPUPercent: currentCPU,
      currentMemoryPercent: 0,
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

  const statusBadge = useMemo(
    () =>
      isHistory ? null : (
        <CPUHistoryBadge value={duration} onChange={setDuration} />
      ),
    [isHistory, duration, setDuration],
  );

  return (
    <WidgetWrapper id={id} statusBadge={statusBadge}>
      <div ref={containerRef} className={containerClassName}>
        <div className="w-full flex-shrink-0">
          <CpuMemoryOverview
            cpuUsage={metricsValues.currentCPUPercent}
            memoryBytes={metricsValues.currentMemoryProcess}
            totalCores={metricsValues.totalCores}
            isLoading={metricsValues.isLoading}
          />
        </div>

        <div className="w-full flex-1 min-h-0">
          <CpuMemoryChartUplot
            currentCPUPercent={metricsValues.currentCPUPercent}
            currentMemoryBytes={metricsValues.currentMemoryProcess}
            animating={!isResizing && !isHistory}
            maxPoints={maxPoints}
            windowDuration={windowDuration}
            historyStats={isHistory ? stats : undefined}
          />
        </div>
      </div>
    </WidgetWrapper>
  );
});

MetricsMonitor.displayName = 'MetricsMonitor';

export default MetricsMonitor;
