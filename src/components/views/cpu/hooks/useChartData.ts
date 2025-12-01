import { useState, useEffect, useRef } from 'react';
import { CpuMemoryDataPoint } from '@/utils/charts/cpuMemory';

export const useChartData = (
  currentCPUPercent: number,
  currentMemoryMB: number,
  isLive: boolean,
  maxPoints: number,
  windowDuration: number | undefined,
  throttleInterval: number,
) => {
  const [dataPoints, setDataPoints] = useState<CpuMemoryDataPoint[]>([]);
  const lastUpdateRef = useRef<number>(0);
  const lastValuesRef = useRef<{ cpu: number; memory: number }>({
    cpu: -1,
    memory: -1,
  });

  useEffect(() => {
    if (!isLive) return;

    const now = Date.now();

    // Throttle updates
    if (now - lastUpdateRef.current < throttleInterval) return;

    // Only add point if values have changed (prevents waste when GPAC stopped)
    if (
      lastValuesRef.current.cpu === currentCPUPercent &&
      lastValuesRef.current.memory === currentMemoryMB
    ) {
      return;
    }

    lastUpdateRef.current = now;
    lastValuesRef.current = { cpu: currentCPUPercent, memory: currentMemoryMB };

    setDataPoints((prev) => {
      // Add new point with timestamp only (relative time calculated in chart)
      const newPoint: CpuMemoryDataPoint = {
        timestamp: now,
        cpu_percent: currentCPUPercent,
        memory_mb: currentMemoryMB,
      };

      // Use push for efficiency
      const newPoints = [...prev, newPoint];

      // Trim based on window or max points
      let trimmed = newPoints;
      if (windowDuration && windowDuration !== Infinity) {
        const cutoff = now - windowDuration;
        const firstValidIdx = trimmed.findIndex((p) => p.timestamp >= cutoff);
        if (firstValidIdx > 0) {
          trimmed = trimmed.slice(firstValidIdx);
        }
      } else if (trimmed.length > maxPoints) {
        trimmed = trimmed.slice(trimmed.length - maxPoints);
      }

      return trimmed;
    });
  }, [
    currentCPUPercent,
    currentMemoryMB,
    isLive,
    maxPoints,
    windowDuration,
    throttleInterval,
  ]);

  return { dataPoints };
};
