import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { formatBytes, formatChartTime } from '@/utils/formatting';
import {
  addNetworkDataPoint,
  ChartDataPoint,
} from '@/shared/store/slices/monitoredFilterSlice';
import { RootState } from '@/shared/store';
import { selectFilterNetworkChartData } from '@/shared/store/selectors';
import { useGpacService } from '@/shared/hooks/connection/useGpacService';

interface UseBandwidthChartLiveOptions {
  filterId: string;
  currentBytes: number;
  refreshInterval: number;
  type: 'outband' | 'inband';
  windowDurationMs?: number;
}

export const useBandwidthChartLive = ({
  filterId,
  currentBytes,
  refreshInterval,
  type,
  windowDurationMs,
}: UseBandwidthChartLiveOptions) => {
  const dispatch = useDispatch();
  const gpacService = useGpacService();

  const rawDataPoints = useSelector((state: RootState) => {
    const networkData = selectFilterNetworkChartData(state, filterId);
    return type === 'outband'
      ? (networkData?.outband ?? [])
      : (networkData?.inband ?? []);
  });

  const dataPoints = useMemo(() => {
    if (!windowDurationMs || !Number.isFinite(windowDurationMs)) {
      return rawDataPoints;
    }
    if (rawDataPoints.length === 0) return rawDataPoints;
    const cutoff = Date.now() - windowDurationMs;
    const firstIndexInWindow = rawDataPoints.findIndex(
      (point) => point.timestamp >= cutoff,
    );
    if (firstIndexInWindow <= 0) return rawDataPoints;
    return rawDataPoints.slice(firstIndexInWindow);
  }, [rawDataPoints, windowDurationMs]);

  const lastBytesRef = useRef<number>(currentBytes);
  const lastTimestampRef = useRef<number>(Date.now());
  const currentBytesRef = useRef<number>(currentBytes);
  const isInitializedRef = useRef<boolean>(false);

  const formatBandwidth = useCallback(
    (value: number): string => `${formatBytes(value)}/s`,
    [],
  );

  useEffect(() => {
    currentBytesRef.current = currentBytes;
  }, [currentBytes]);

  const addSamplePoint = useCallback(
    (bytesPerSecond: number, sampleTimestamp: number) => {
      const newPoint: ChartDataPoint = {
        time: formatChartTime(),
        timestamp: sampleTimestamp,
        value: bytesPerSecond,
      };
      dispatch(addNetworkDataPoint({ filterId, type, point: newPoint }));
      lastBytesRef.current = currentBytesRef.current;
      lastTimestampRef.current = sampleTimestamp;
    },
    [dispatch, filterId, type],
  );

  useEffect(() => {
    if (isInitializedRef.current) return;
    const now = Date.now();
    isInitializedRef.current = true;
    lastBytesRef.current = currentBytes;
    lastTimestampRef.current = now;
  }, [currentBytes, dispatch, filterId, type]);

  useEffect(() => {
    if (!isInitializedRef.current) return;
    if (!gpacService.isConnected()) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let immediateTimeout: ReturnType<typeof setTimeout> | null = null;

    const addPoint = () => {
      if (!gpacService.isConnected()) {
        if (intervalId) clearInterval(intervalId);
        return;
      }
      const now = Date.now();
      const lastTimestamp = lastTimestampRef.current;
      if (now <= lastTimestamp) return;
      const elapsedSecs = (now - lastTimestamp) / 1000;
      const bytesDelta = currentBytesRef.current - lastBytesRef.current;
      const bytesPerSecond = Math.max(0, bytesDelta / elapsedSecs);
      addSamplePoint(bytesPerSecond, now);
    };

    if (rawDataPoints.length === 0) {
      immediateTimeout = setTimeout(addPoint, 100);
      intervalId = setInterval(addPoint, refreshInterval);
      return () => {
        if (immediateTimeout) clearTimeout(immediateTimeout);
        if (intervalId) clearInterval(intervalId);
      };
    }

    intervalId = setInterval(addPoint, refreshInterval);
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [refreshInterval, addSamplePoint, gpacService, rawDataPoints.length]);

  const tooltipFormatter = useCallback(
    (value: number | string | Array<number | string>) => {
      if (typeof value === 'number')
        return [formatBandwidth(value), 'Bandwidth'];
      return [value, 'Bandwidth'];
    },
    [formatBandwidth],
  );

  return { dataPoints, formatBandwidth, tooltipFormatter };
};
