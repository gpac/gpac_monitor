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

interface UseBandwidthChartLiveOptions {
  filterId: string;
  currentBytes: number;
  refreshInterval: number;
  type: 'upload' | 'download';
}

export const useBandwidthChartLive = ({
  filterId,
  currentBytes,
  refreshInterval,
  type,
}: UseBandwidthChartLiveOptions) => {
  const dispatch = useDispatch();
  const gpacService = useGpacService();

  const dataPoints = useSelector((state: RootState) =>
    type === 'upload'
      ? selectFilterUploadData(state, filterId)
      : selectFilterDownloadData(state, filterId),
  );

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
    if (dataPoints.length > 0) {
      const lastDataPoint = dataPoints[dataPoints.length - 1];
      lastTimestampRef.current = lastDataPoint.timestamp;
      lastBytesRef.current = currentBytes;
      return;
    }
    lastBytesRef.current = currentBytes;
    lastTimestampRef.current = now;
  }, [currentBytes, dataPoints, dispatch, filterId, type]);

  useEffect(() => {
    if (!isInitializedRef.current) return;
    if (!gpacService.isConnected()) return;

    let intervalId: NodeJS.Timeout | null = null;
    let immediateTimeout: NodeJS.Timeout | null = null;

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

    if (dataPoints.length === 0) {
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
  }, [refreshInterval, addSamplePoint, gpacService, dataPoints.length]);

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
