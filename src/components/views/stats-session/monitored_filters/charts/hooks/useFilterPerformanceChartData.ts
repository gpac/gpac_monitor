import { useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { formatChartTime } from '@/utils/formatting';
import {
  addCombinedNetworkPoint,
  type ChartDataPoint,
} from '@/shared/store/slices/monitoredFilterSlice';
import type { RootState } from '@/shared/store';
import {
  selectFilterNetworkChartData,
  selectFilterLastTaskTimeData,
} from '@/shared/store/selectors';

export interface FilterPerformanceChartOptions {
  filterId: string;
  bytesSent: number;
  bytesReceived: number;
  /** time spent in last task in microseconds */
  lastTaskTimeUs: number;
  windowDurationMs?: number;
}

const applyWindow = (
  points: ChartDataPoint[],
  windowDurationMs?: number,
): ChartDataPoint[] => {
  if (!windowDurationMs || points.length === 0) return points;
  const cutoff = Date.now() - windowDurationMs;
  const first = points.findIndex((p) => p.timestamp >= cutoff);
  return first <= 0 ? points : points.slice(first);
};

export const useFilterPerformanceChartData = ({
  filterId,
  bytesSent,
  bytesReceived,
  lastTaskTimeUs,
  windowDurationMs,
}: FilterPerformanceChartOptions) => {
  const dispatch = useDispatch();
  const prevRef = useRef({ bytesSent, bytesReceived, timestamp: Date.now() });
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const now = Date.now();
    const elapsed = (now - prevRef.current.timestamp) / 1000;

    if (isInitializedRef.current && elapsed > 0) {
      const time = formatChartTime();
      dispatch(
        addCombinedNetworkPoint({
          filterId,
          outband: {
            time,
            timestamp: now,
            value: Math.max(
              0,
              (bytesSent - prevRef.current.bytesSent) / elapsed,
            ),
          },
          inband: {
            time,
            timestamp: now,
            value: Math.max(
              0,
              (bytesReceived - prevRef.current.bytesReceived) / elapsed,
            ),
          },
          lastTaskTime: { time, timestamp: now, value: lastTaskTimeUs },
        }),
      );
    }

    prevRef.current = { bytesSent, bytesReceived, timestamp: now };
    isInitializedRef.current = true;
  }, [bytesSent, bytesReceived, lastTaskTimeUs, filterId, dispatch]);

  const rawNetwork = useSelector((state: RootState) =>
    selectFilterNetworkChartData(state, filterId),
  );
  const rawLastTaskTime = useSelector((state: RootState) =>
    selectFilterLastTaskTimeData(state, filterId),
  );

  const outbandPoints = useMemo(
    () => applyWindow(rawNetwork?.outband ?? [], windowDurationMs),
    [rawNetwork?.outband, windowDurationMs],
  );
  const inbandPoints = useMemo(
    () => applyWindow(rawNetwork?.inband ?? [], windowDurationMs),
    [rawNetwork?.inband, windowDurationMs],
  );
  const lastTaskTimePoints = useMemo(
    () => applyWindow(rawLastTaskTime, windowDurationMs),
    [rawLastTaskTime, windowDurationMs],
  );

  return { outbandPoints, inbandPoints, lastTaskTimePoints };
};
