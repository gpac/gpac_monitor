import { useState, useCallback, useEffect, useRef } from 'react';
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
  const lastRecordedCPURef = useRef<number>(0);
  const lastRecordedMemoryRef = useRef<number>(0);
  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Refs to avoid recreating callback on every value change
  const currentCPURef = useRef(currentCPUPercent);
  const currentMemoryRef = useRef(currentMemoryMB);
  const isLiveRef = useRef(isLive);
  const maxPointsRef = useRef(maxPoints);
  const windowDurationRef = useRef(windowDuration);

  currentCPURef.current = currentCPUPercent;
  currentMemoryRef.current = currentMemoryMB;
  isLiveRef.current = isLive;
  maxPointsRef.current = maxPoints;
  windowDurationRef.current = windowDuration;

  const updateDataPoints = useCallback(() => {
    const cpu = currentCPURef.current;
    const memory = currentMemoryRef.current;

    if (
      !isLiveRef.current ||
      (cpu === lastRecordedCPURef.current &&
        memory === lastRecordedMemoryRef.current)
    )
      return;

    lastRecordedCPURef.current = cpu;
    lastRecordedMemoryRef.current = memory;
    const now = Date.now();

    setDataPoints((prevPoints) => {
      let filteredPoints = prevPoints;
      const maxPts = maxPointsRef.current;
      const winDur = windowDurationRef.current;

      if (winDur && winDur !== Infinity) {
        const cutoff = now - winDur;
        filteredPoints = prevPoints.filter((p) => p.timestamp >= cutoff);
      } else if (prevPoints.length >= maxPts) {
        filteredPoints = prevPoints.slice(prevPoints.length - maxPts + 1);
      }

      const oldestTimestamp =
        filteredPoints.length > 0 ? filteredPoints[0].timestamp : now;
      const relativeSeconds = ((now - oldestTimestamp) / 1000).toFixed(1);
      const time = `${relativeSeconds}s`;

      const newPoint: CpuMemoryDataPoint = {
        timestamp: now,
        time,
        cpu_percent: cpu,
        memory_mb: memory,
      };
      const newPoints = [...filteredPoints, newPoint];

      const oldest = newPoints[0].timestamp;
      return newPoints.map((point) => ({
        ...point,
        time: `${((point.timestamp - oldest) / 1000).toFixed(1)}s`,
      }));
    });
  }, []); // Empty deps - stable callback

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
