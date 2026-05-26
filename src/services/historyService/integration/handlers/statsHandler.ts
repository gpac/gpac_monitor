import type { AppDispatch } from '@/shared/store';
import type { CPUStats } from '@/types/domain/system';
import type { ChartDataPoint } from '@/shared/store/slices/monitoredFilterSlice';
import type { SessionFilterStats } from '@/shared/store/slices/sessionStatsSlice';
import type { SessionStatsEvent, CpuStatsEvent } from '../../types';
import type { PIDSample, PIDDynamicByFilter } from '../extractPIDSamples';
import {
  addNetworkDataPoint,
  bulkAddNetworkData,
  addPIDSamples,
} from '@/shared/store/slices/monitoredFilterSlice';
import {
  updateSessionStats,
  setFilterPids,
} from '@/shared/store/slices/sessionStatsSlice';
import type { FilterPids } from '@/shared/store/slices/sessionStatsSlice';
import {
  setSystemStats,
  bulkAddSystemStats,
} from '@/shared/store/slices/sessionDetailsSlice';
import { computeBandwidthPoints } from '../computeBandwidth';
import { formatCompactTime } from '@/utils/formatting/time';
import { extractPIDSamples, extractPIDDynamic } from '../extractPIDSamples';

export type BandwidthBuffer = Record<
  string,
  { outband: ChartDataPoint[]; inband: ChartDataPoint[] }
>;

export type PrevBandwidthState = Record<
  string,
  { bytes_sent: number; bytes_done: number; ts_us: number }
>;

export type PIDSamplesBuffer = PIDSample[];

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
  pendingPIDSamples: PIDSamplesBuffer,
  pendingPIDDynamic: PIDDynamicByFilter,
): {
  pendingStats: typeof pendingStats;
  pendingBandwidth: BandwidthBuffer;
  pendingPIDSamples: PIDSamplesBuffer;
  pendingPIDDynamic: PIDDynamicByFilter;
} {
  const statsPayload = {
    stats: event.stats as SessionFilterStats[],
    ts_us: event.ts_us,
  };
  const pidSamples = extractPIDSamples(
    event.stats,
    event.ts_us,
    sessionStartUs,
  );
  const pidDynamic = extractPIDDynamic(event.stats);

  if (silent) {
    pendingStats = statsPayload;
    pendingPIDSamples.push(...pidSamples);
    pendingPIDDynamic = { ...pendingPIDDynamic, ...pidDynamic };
  } else {
    dispatch(updateSessionStats(statsPayload));
    if (pidSamples.length) dispatch(addPIDSamples(pidSamples));
    if (Object.keys(pidDynamic).length)
      dispatch(setFilterPids(pidDynamic as Record<string, FilterPids>));
  }

  const points = computeBandwidthPoints(event, sessionStartUs, prevBandwidth);

  if (silent) {
    for (const point of points) {
      if (!pendingBandwidth[point.filterId])
        pendingBandwidth[point.filterId] = { outband: [], inband: [] };
      pendingBandwidth[point.filterId].outband.push(point.outband);
      pendingBandwidth[point.filterId].inband.push(point.inband);
    }
  } else {
    for (const point of points) {
      dispatch(
        addNetworkDataPoint({
          filterId: point.filterId,
          type: 'outband',
          point: point.outband,
        }),
      );
      dispatch(
        addNetworkDataPoint({
          filterId: point.filterId,
          type: 'inband',
          point: point.inband,
        }),
      );
    }
  }

  return {
    pendingStats,
    pendingBandwidth,
    pendingPIDSamples,
    pendingPIDDynamic,
  };
}

export function dispatchCpuStats(
  dispatch: AppDispatch,
  event: CpuStatsEvent,
  silent: boolean,
  pendingCpuStats: CPUStats[],
  sessionStartUs = 0,
): void {
  const stats = mapCpuStatsEvent(event);
  if (sessionStartUs > 0) {
    stats.time = formatCompactTime(event.ts_us - sessionStartUs);
  }
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
  pendingPIDSamples: PIDSamplesBuffer,
  pendingPIDDynamic: PIDDynamicByFilter,
): void {
  if (pendingStats) dispatch(updateSessionStats(pendingStats));
  if (Object.keys(pendingBandwidth).length)
    dispatch(bulkAddNetworkData(pendingBandwidth));
  if (pendingCpuStats.length) dispatch(bulkAddSystemStats(pendingCpuStats));
  if (pendingPIDSamples.length) dispatch(addPIDSamples(pendingPIDSamples));
  if (Object.keys(pendingPIDDynamic).length)
    dispatch(setFilterPids(pendingPIDDynamic as Record<string, FilterPids>));
}
