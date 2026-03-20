import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { formatBytes, formatChartTime } from '@/utils/formatting';
import {
  selectSessionStats,
  selectPreviousSessionStats,
  selectLastUpdateUs,
} from '@/shared/store/selectors/session/sessionStatsSelectors';
import type { ChartDataPoint } from '@/shared/store/slices/monitoredFilterSlice';

const MAX_POINTS = 300;

interface UseBandwidthChartHistoryOptions {
  filterId: string;
  type: 'upload' | 'download';
}

export const useBandwidthChartHistory = ({
  filterId,
  type,
}: UseBandwidthChartHistoryOptions) => {
  const sessionStats = useSelector(selectSessionStats);
  const prevSessionStats = useSelector(selectPreviousSessionStats);
  const lastUpdateUs = useSelector(selectLastUpdateUs);

  const [dataPoints, setDataPoints] = useState<ChartDataPoint[]>([]);
  const prevTsUsRef = useRef<number | null>(null);

  const getBytes = useCallback(
    (stats: typeof sessionStats) => {
      const entry = stats[filterId];
      if (!entry) return 0;
      return type === 'upload'
        ? (entry.bytes_sent ?? 0)
        : (entry.bytes_done ?? 0);
    },
    [filterId, type],
  );

  useEffect(() => {
    if (lastUpdateUs === null) return;

    const prevTsUs = prevTsUsRef.current;

    if (prevTsUs === null) {
      prevTsUsRef.current = lastUpdateUs;
      return;
    }

    const deltaTimeSec = (lastUpdateUs - prevTsUs) / 1_000_000;
    prevTsUsRef.current = lastUpdateUs;

    if (deltaTimeSec <= 0) return;

    const currBytes = getBytes(sessionStats);
    const prevBytes = getBytes(prevSessionStats);
    const rate = Math.max(0, (currBytes - prevBytes) / deltaTimeSec);

    const point: ChartDataPoint = {
      time: formatChartTime(),
      timestamp: lastUpdateUs,
      value: rate,
    };

    setDataPoints((prev) => {
      const next = [...prev, point];
      return next.length > MAX_POINTS
        ? next.slice(next.length - MAX_POINTS)
        : next;
    });
  }, [lastUpdateUs]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatBandwidth = useCallback(
    (value: number): string => `${formatBytes(value)}/s`,
    [],
  );

  const tooltipFormatter = useCallback(
    (value: number | string | Array<number | string>) => {
      if (typeof value === 'number')
        return [formatBandwidth(value), 'Bandwidth'];
      return [value as string, 'Bandwidth'];
    },
    [formatBandwidth],
  );

  return { dataPoints, formatBandwidth, tooltipFormatter };
};
