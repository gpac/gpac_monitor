import React, { useState, useDeferredValue, useMemo, useCallback } from 'react';

import { CPUChart } from './components/CPUChart';
import { CPUOverview } from './components/CPUOverview';
import { LiveToggle } from './components/LiveToggle';
import { MemoryChart } from './components/MemoryChart';
import { useCPUStats } from './hooks/useCPUStats';
import WidgetWrapper from '@/components/common/WidgetWrapper';

interface MetricsMonitorProps {
  id: string;
  title: string;
}

const MetricsMonitor: React.FC<MetricsMonitorProps> = React.memo(({ id, title }) => {
  const [isLive, setIsLive] = useState(true);

  // Collecte des données à 150ms (throttlé à 500ms dans le messageHandler)
  const { stats, isSubscribed } = useCPUStats(isLive, 150);

  const deferredStats = useDeferredValue(stats);
  const deferredSubscribed = useDeferredValue(isSubscribed);

  // Memoize current stats calculation to avoid recalculating on every render
  const currentStats = useMemo(() => {
    return deferredStats.length > 0 ? deferredStats[deferredStats.length - 1] : null;
  }, [deferredStats]);

  // Memoize derived values to avoid recalculation
  const metricsValues = useMemo(() => ({
    currentCPUPercent: currentStats?.process_cpu_usage || 0,
    currentMemoryPercent: currentStats?.process_memory_percent || 0,
    currentMemoryProcess: currentStats?.process_memory || 0,
    totalCores: currentStats?.nb_cores || 0,
    isLoading: !deferredSubscribed,
  }), [currentStats, deferredSubscribed]);

  // Memoize the toggle callback to prevent child re-renders
  const handleToggleLive = useCallback((newIsLive: boolean) => {
    setIsLive(newIsLive);
  }, []);

  return (
    <WidgetWrapper id={id} title={title}>
      <div className="container mx-auto space-y-4 p-4">
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

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CPUChart currentCPUPercent={metricsValues.currentCPUPercent} isLive={isLive} />
          <MemoryChart
            currentMemoryPercent={metricsValues.currentMemoryPercent}
            currentMemoryProcess={metricsValues.currentMemoryProcess}
            isLive={isLive}
          />
        </div>
      </div>
    </WidgetWrapper>
  );
});

MetricsMonitor.displayName = 'MetricsMonitor';

export default MetricsMonitor;
