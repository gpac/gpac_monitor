import type { ChartDataPoint } from '@/shared/store/slices/monitoredFilterSlice';
import type { SessionStatsEvent } from '../types';

type BandwidthRef = { bytes_sent: number; bytes_done: number; ts_us: number };

export interface BandwidthPoint {
  filterId: string;
  outband: ChartDataPoint;
  inband: ChartDataPoint;
  lastTaskTime: ChartDataPoint;
}

/**
 * Compute bandwidth delta points from a session_stats event.
 */
export function computeBandwidthPoints(
  event: SessionStatsEvent,
  sessionStartUs: number,
  prevBandwidth: Record<string, BandwidthRef>,
): BandwidthPoint[] {
  const sessionTimeUs = event.ts_us - sessionStartUs;
  const points: BandwidthPoint[] = [];

  for (const filter of event.stats) {
    const filterId = filter.idx.toString();
    const prev = prevBandwidth[filterId];
    let outbandValue = 0;
    let inbandValue = 0;

    if (prev) {
      const deltaSec = (event.ts_us - prev.ts_us) / 1_000_000;
      if (deltaSec > 0) {
        outbandValue = Math.max(
          0,
          ((filter.bytes_sent ?? 0) - prev.bytes_sent) / deltaSec,
        );
        inbandValue = Math.max(
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
      outband: { timestamp: sessionTimeUs, value: outbandValue },
      inband: { timestamp: sessionTimeUs, value: inbandValue },
      lastTaskTime: {
        timestamp: sessionTimeUs,
        value: filter.last_task_time ?? 0,
      },
    });
  }

  return points;
}
