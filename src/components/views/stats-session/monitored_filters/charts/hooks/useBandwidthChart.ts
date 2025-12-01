import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { formatBytes, formatChartTime } from '@/utils/formatting';
import {
  addNetworkDataPoint,
  ChartDataPoint,
} from '@/shared/store/slices/monitoredFilterSlice';
import { RootState } from '@/shared/store';
import {
  selectFilterUploadData,
  selectFilterDownloadData,
} from '@/shared/store/selectors';
import { useGpacService } from '@/shared/hooks/useGpacService';

export interface DataPoint {
  time: string;
  timestamp: number;
  bytesPerSecond: number;
}

interface UseBandwidthChartOptions {
  filterId: string;
  currentBytes: number;
  refreshInterval: number;
  type: 'upload' | 'download';
}

export const useBandwidthChart = ({
  filterId,
  currentBytes,
  refreshInterval,
  type,
}: UseBandwidthChartOptions) => {
  const dispatch = useDispatch();
  const gpacService = useGpacService();

  // Select data from Redux store based on type
  const dataPoints = useSelector((state: RootState) =>
    type === 'upload'
      ? selectFilterUploadData(state, filterId)
      : selectFilterDownloadData(state, filterId),
  );

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
      const newPoint: ChartDataPoint = {
        time: formatChartTime(),
        timestamp: sampleTimestamp,
        value: bytesPerSecond,
      };

      // Dispatch to Redux - slice handles sliding window automatically
      dispatch(
        addNetworkDataPoint({
          filterId,
          type,
          point: newPoint,
        }),
      );

      lastBytesRef.current = currentBytesRef.current;
      lastTimestampRef.current = sampleTimestamp;
    },
    [dispatch, filterId, type],
  );

  // Initialize refs ONCE on mount
  useEffect(() => {
    if (isInitializedRef.current) return;

    const now = Date.now();
    isInitializedRef.current = true;

    // If we have existing data in Redux (returning to tab or already monitoring)
    if (dataPoints.length > 0) {
      // Continue from last known data point
      const lastDataPoint = dataPoints[dataPoints.length - 1];
      lastTimestampRef.current = lastDataPoint.timestamp;
      lastBytesRef.current = currentBytes;
      return;
    }

    lastBytesRef.current = currentBytes;
    lastTimestampRef.current = now;
  }, [currentBytes, dataPoints, dispatch, filterId, type]);

  // Update bandwidth data at refresh interval
  useEffect(() => {
    if (!isInitializedRef.current) return;
    if (!gpacService.isConnected()) return;

    let intervalId: NodeJS.Timeout | null = null;
    let immediateTimeout: NodeJS.Timeout | null = null;

    // Calculate and add first point immediately (don't wait for interval)
    const addPoint = () => {
      if (!gpacService.isConnected()) {
        // Connection lost - stop the interval
        if (intervalId) clearInterval(intervalId);
        return;
      }

      const now = Date.now();
      const lastTimestamp = lastTimestampRef.current;

      if (now <= lastTimestamp) return;

      const elapsedSecs = (now - lastTimestamp) / 1000;
      const latestBytes = currentBytesRef.current;
      const bytesDelta = latestBytes - lastBytesRef.current;
      const bytesPerSecond = Math.max(0, bytesDelta / elapsedSecs);

      addSamplePoint(bytesPerSecond, now);
    };

    // Add first point immediately if no existing data
    if (dataPoints.length === 0) {
      // Use setTimeout to ensure currentBytes is up-to-date
      immediateTimeout = setTimeout(addPoint, 100);

      // Set up recurring interval
      intervalId = setInterval(addPoint, refreshInterval);

      return () => {
        if (immediateTimeout) clearTimeout(immediateTimeout);
        if (intervalId) clearInterval(intervalId);
      };
    }

    // If we have existing data, just use the interval
    intervalId = setInterval(addPoint, refreshInterval);
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [refreshInterval, addSamplePoint, gpacService, dataPoints.length]);

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
