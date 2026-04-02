import type { AppDispatch } from '@/shared/store';
import type { CPUStats } from '@/types/domain/system';
import type { ChartDataPoint } from '@/shared/store/slices/monitoredFilterSlice';
import type { SessionFilterStats } from '@/shared/store/slices/sessionStatsSlice';
import type { SessionStatsEvent, CpuStatsEvent } from '../../types';
import {
  addNetworkDataPoint,
  bulkAddNetworkData,
} from '@/shared/store/slices/monitoredFilterSlice';
import { updateSessionStats } from '@/shared/store/slices/sessionStatsSlice';
import {
  setSystemStats,
  bulkAddSystemStats,
} from '@/shared/store/slices/sessionDetailsSlice';
import { computeBandwidthPoints } from '../computeBandwidth';

export type BandwidthBuffer = Record<
  string,
  { upload: ChartDataPoint[]; download: ChartDataPoint[] }
>;

export type PrevBandwidthState = Record<
  string,
  { bytes_sent: number; bytes_done: number; ts_us: number }
>;

export function mapCpuStatsEvent(event: CpuStatsEvent): CPUStats {
  return {
    ...event.stats,
    timestamp: event.ts_us,
    memory_usage_percent: event.stats.memory_usage_percent ?? 0,
    process_memory_percent: event.stats.process_memory_percent ?? 0,
    gpac_memory_percent: event.stats.gpac_memory_percent ?? 0,
    cpu_efficiency: event.stats.cpu_efficiency ?? 0,
  };
}

export function dispatchSessionStats(
  dispatch: AppDispatch,
  event: SessionStatsEvent,
  sessionStartUs: number,
  prevBandwidth: PrevBandwidthState,
  silent: boolean,
  pendingStats: { stats: SessionFilterStats[]; ts_us: number } | null,
  pendingBandwidth: BandwidthBuffer,
): { pendingStats: typeof pendingStats; pendingBandwidth: BandwidthBuffer } {
  const statsPayload = {
    stats: event.stats as SessionFilterStats[],
    ts_us: event.ts_us,
  };

  if (silent) {
    pendingStats = statsPayload;
  } else {
    dispatch(updateSessionStats(statsPayload));
  }

  const points = computeBandwidthPoints(event, sessionStartUs, prevBandwidth);

  if (silent) {
    for (const point of points) {
      if (!pendingBandwidth[point.filterId])
        pendingBandwidth[point.filterId] = { upload: [], download: [] };
      pendingBandwidth[point.filterId].upload.push(point.upload);
      pendingBandwidth[point.filterId].download.push(point.download);
    }
  } else {
    for (const point of points) {
      dispatch(
        addNetworkDataPoint({
          filterId: point.filterId,
          type: 'upload',
          point: point.upload,
        }),
      );
      dispatch(
        addNetworkDataPoint({
          filterId: point.filterId,
          type: 'download',
          point: point.download,
        }),
      );
    }
  }

  return { pendingStats, pendingBandwidth };
}

export function dispatchCpuStats(
  dispatch: AppDispatch,
  event: CpuStatsEvent,
  silent: boolean,
  pendingCpuStats: CPUStats[],
): void {
  const stats = mapCpuStatsEvent(event);
  if (silent) {
    pendingCpuStats.push(stats);
  } else {
    dispatch(setSystemStats(stats));
  }
}

export function flushStats(
  dispatch: AppDispatch,
  pendingStats: { stats: SessionFilterStats[]; ts_us: number } | null,
  pendingBandwidth: BandwidthBuffer,
  pendingCpuStats: CPUStats[],
): void {
  if (pendingStats) dispatch(updateSessionStats(pendingStats));
  if (Object.keys(pendingBandwidth).length)
    dispatch(bulkAddNetworkData(pendingBandwidth));
  if (pendingCpuStats.length) dispatch(bulkAddSystemStats(pendingCpuStats));
}
