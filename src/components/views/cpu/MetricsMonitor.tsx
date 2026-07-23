import React, { useState, useMemo } from 'react';
import { useOptimizedResize } from '@/shared/hooks/ui/useOptimizedResize';
import { useDataMode } from '@/shared/hooks/data/useDataMode';

import { CpuMemoryChartUplot } from './components/CpuMemoryChartUplot';
import { CpuMemoryOverview } from './components/CpuMemoryOverview';
import { useCPUStats } from './hooks/useCPUStats';
import WidgetWrapper from '@/components/widget/WidgetWrapper';
import { WindowDurationBadge } from '@/components/common/WindowDurationBadge';
import { useChartDuration, useAppSelector } from '@/shared/hooks';
import { selectCpuStatsInterval } from '@/shared/store/selectors';
import type { ChartDuration } from '@/utils/charts';
import { DEFAULT_CPU_HISTORY, CPU_HISTORY_STORAGE_KEY } from './constants';

const CPU_DURATION_OPTIONS: ChartDuration[] = [
  '20s',
  '1min',
  '5min',
  'unlimited',
];

const BASE_CONTAINER_CLASS = 'flex flex-col gap-2 p-2 h-full';
const RESIZING_CLASS = 'contain-layout contain-style';

interface MetricsMonitorProps {
  id: string;
}

const MetricsMonitor: React.FC<MetricsMonitorProps> = React.memo(({ id }) => {
  const [isResizing, setIsResizing] = useState(false);

  const cpuStatsInterval = useAppSelector(selectCpuStatsInterval);

  // Chart duration management (encapsulated logic)
  const { duration, setDuration, windowDuration, maxPoints } = useChartDuration(
    CPU_HISTORY_STORAGE_KEY,
    DEFAULT_CPU_HISTORY,
    cpuStatsInterval,
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

  const { isSubscribed, currentCPU, currentMemory, totalCores } = useCPUStats(
    true,
    cpuStatsInterval,
  );

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
        <WindowDurationBadge
          value={duration}
          onChange={setDuration}
          options={CPU_DURATION_OPTIONS}
        />
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
          />
        </div>
      </div>
    </WidgetWrapper>
  );
});

MetricsMonitor.displayName = 'MetricsMonitor';

export default MetricsMonitor;
