import { useCallback, useEffect, useRef, useState } from 'react';
import { formatBytes, formatChartTime } from '@/utils/formatting';
import { MAX_POINTS } from '../config/bandwidthChartConfig';

export interface DataPoint {
  time: string;
  timestamp: number;
  bytesPerSecond: number;
}

interface UseBandwidthChartOptions {
  currentBytes: number;
  refreshInterval: number;
}

export const useBandwidthChart = ({
  currentBytes,
  refreshInterval,
}: UseBandwidthChartOptions) => {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);

  const lastBytesRef = useRef<number>(currentBytes);
  const lastTimestampRef = useRef<number>(Date.now());
  const currentBytesRef = useRef<number>(currentBytes);
  const isInitializedRef = useRef<boolean>(false);

  // Format bandwidth for display
  const formatBandwidth = useCallback((value: number): string => {
    return `${formatBytes(value)}/s`;
  }, []);

  // Update current bytes ref
  useEffect(() => {
    currentBytesRef.current = currentBytes;
  }, [currentBytes]);

  // Add sample point to chart
  const addSamplePoint = useCallback(
    (bytesPerSecond: number, sampleTimestamp: number) => {
      const newPoint: DataPoint = {
        time: formatChartTime(),
        timestamp: sampleTimestamp,
        bytesPerSecond,
      };

      setDataPoints((prev) => {
        const newPoints = [...prev, newPoint];
        return newPoints.length > MAX_POINTS
          ? newPoints.slice(-MAX_POINTS)
          : newPoints;
      });

      lastBytesRef.current = currentBytesRef.current;
      lastTimestampRef.current = sampleTimestamp;
    },
    [],
  );

  // Initialize chart data ONCE on mount
  useEffect(() => {
    if (isInitializedRef.current) return;

    const now = Date.now();
    lastBytesRef.current = currentBytes;
    lastTimestampRef.current = now;
    isInitializedRef.current = true;

    // Add initial point immediately
    setDataPoints([
      {
        time: formatChartTime(),
        timestamp: now,
        bytesPerSecond: 0,
      },
    ]);
  }, [currentBytes]);

  // Update bandwidth data at refresh interval
  useEffect(() => {
    if (!isInitializedRef.current) return;

    const intervalId = setInterval(() => {
      const now = Date.now();
      const lastTimestamp = lastTimestampRef.current;

      if (now <= lastTimestamp) return;

      const elapsedSecs = (now - lastTimestamp) / 1000;
      const latestBytes = currentBytesRef.current;
      const bytesDelta = latestBytes - lastBytesRef.current;
      if (bytesDelta === 0) return;

      const bytesPerSecond = Math.max(0, bytesDelta / elapsedSecs);

      addSamplePoint(bytesPerSecond, now);
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, addSamplePoint]);

  const tooltipFormatter = useCallback(
    (value: number | string | Array<number | string>) => {
      if (typeof value === 'number') {
        return [formatBandwidth(value), 'Bandwidth'];
      }
      return [value, 'Bandwidth'];
    },
    [formatBandwidth],
  );

  return {
    dataPoints,
    formatBandwidth,
    tooltipFormatter,
  };
};
