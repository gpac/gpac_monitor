import { useState, useCallback, useEffect, useRef } from 'react';
import { CpuMemoryDataPoint } from '../components/CpuMemoryChartUplot';

export const useChartData = (
  currentCPUPercent: number,
  currentMemoryMB: number,
  isLive: boolean,
  maxPoints: number,
  windowDuration: number | undefined,
  throttleInterval: number,
) => {
  const [dataPoints, setDataPoints] = useState<CpuMemoryDataPoint[]>([]);
  const lastRecordedCPURef = useRef<number>(0);
  const lastRecordedMemoryRef = useRef<number>(0);
  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const updateDataPoints = useCallback(() => {
    if (
      !isLive ||
      (currentCPUPercent === lastRecordedCPURef.current &&
        currentMemoryMB === lastRecordedMemoryRef.current)
    )
      return;

    lastRecordedCPURef.current = currentCPUPercent;
    lastRecordedMemoryRef.current = currentMemoryMB;
    const now = Date.now();

    setDataPoints((prevPoints) => {
      let filteredPoints = prevPoints;

      if (windowDuration && windowDuration !== Infinity) {
        const cutoff = now - windowDuration;
        filteredPoints = prevPoints.filter((p) => p.timestamp >= cutoff);
      } else if (prevPoints.length >= maxPoints) {
        filteredPoints = prevPoints.slice(prevPoints.length - maxPoints + 1);
      }

      const oldestTimestamp =
        filteredPoints.length > 0 ? filteredPoints[0].timestamp : now;
      const relativeSeconds = ((now - oldestTimestamp) / 1000).toFixed(1);
      const time = `${relativeSeconds}s`;

      const newPoint: CpuMemoryDataPoint = {
        timestamp: now,
        time,
        cpu_percent: currentCPUPercent,
        memory_mb: currentMemoryMB,
      };
      const newPoints = [...filteredPoints, newPoint];

      const oldest = newPoints[0].timestamp;
      return newPoints.map((point) => ({
        ...point,
        time: `${((point.timestamp - oldest) / 1000).toFixed(1)}s`,
      }));
    });
  }, [currentCPUPercent, currentMemoryMB, isLive, maxPoints, windowDuration]);

  useEffect(() => {
    setDataPoints((prev) => {
      if (prev.length === 0) return prev;

      const now = Date.now();
      let filtered = prev;

      if (windowDuration && windowDuration !== Infinity) {
        const cutoff = now - windowDuration;
        filtered = prev.filter((p) => p.timestamp >= cutoff);
      } else if (prev.length > maxPoints) {
        filtered = prev.slice(prev.length - maxPoints);
      }

      if (filtered.length === 0) return prev;

      const oldest = filtered[0].timestamp;
      return filtered.map((point) => ({
        ...point,
        time: `${((point.timestamp - oldest) / 1000).toFixed(1)}s`,
      }));
    });
  }, [maxPoints, windowDuration]);

  useEffect(() => {
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current);
    }

    throttleTimerRef.current = setTimeout(() => {
      updateDataPoints();
      throttleTimerRef.current = null;
    }, throttleInterval);

    return () => {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
    };
  }, [currentCPUPercent, currentMemoryMB, updateDataPoints, throttleInterval]);

  return { dataPoints };
};
