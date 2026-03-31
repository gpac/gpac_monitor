import type { ChartDataPoint } from '@/shared/store/slices/monitoredFilterSlice';
import { formatCompactTime } from '@/utils/formatting';
import type { SessionStatsEvent } from '../types';

type BandwidthRef = { bytes_sent: number; bytes_done: number; ts_us: number };

export interface BandwidthPoint {
  filterId: string;
  upload: ChartDataPoint;
  download: ChartDataPoint;
}

/**
 * Compute bandwidth delta points from a session_stats event.
 * Pure function — no Redux, no side effects.
 * Mutates prevBandwidth in place for efficiency.
 */
export function computeBandwidthPoints(
  event: SessionStatsEvent,
  sessionStartUs: number,
  prevBandwidth: Record<string, BandwidthRef>,
): BandwidthPoint[] {
  const time = formatCompactTime(event.ts_us - sessionStartUs);
  const points: BandwidthPoint[] = [];

  for (const filter of event.stats) {
    const filterId = filter.idx.toString();
    const prev = prevBandwidth[filterId];
    let uploadValue = 0;
    let downloadValue = 0;

    if (prev) {
      const deltaSec = (event.ts_us - prev.ts_us) / 1_000_000;
      if (deltaSec > 0) {
        uploadValue = Math.max(
          0,
          ((filter.bytes_sent ?? 0) - prev.bytes_sent) / deltaSec,
        );
        downloadValue = Math.max(
          0,
          ((filter.bytes_done ?? 0) - prev.bytes_done) / deltaSec,
        );
      }
    }

    prevBandwidth[filterId] = {
      bytes_sent: filter.bytes_sent ?? 0,
      bytes_done: filter.bytes_done ?? 0,
      ts_us: event.ts_us,
    };

    points.push({
      filterId,
      upload: { time, timestamp: event.ts_us, value: uploadValue },
      download: { time, timestamp: event.ts_us, value: downloadValue },
    });
  }

  return points;
}
