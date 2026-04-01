import type { AppDispatch } from '@/shared/store';
import type { CPUStats } from '@/types/domain/system';
import { updateGraphData, setLoading } from '@/shared/store/slices/graphSlice';
import {
  resetAllData,
  addNetworkDataPoint,
  bulkAddNetworkData,
} from '@/shared/store/slices/monitoredFilterSlice';
import type { ChartDataPoint } from '@/shared/store/slices/monitoredFilterSlice';
import {
  setCommandLine,
  clearSessionDetails,
  setSystemStats,
  bulkAddSystemStats,
} from '@/shared/store/slices/sessionDetailsSlice';
import {
  updateSessionStats,
  setFilterPids,
} from '@/shared/store/slices/sessionStatsSlice';
import type { SessionFilterStats } from '@/shared/store/slices/sessionStatsSlice';
import {
  applyArgUpdate,
  hydrateFilterArgs,
} from '@/shared/store/slices/filterArgumentSlice';
import type {
  HistoryEvent,
  HistorySnapshot,
  FiltersEvent,
  SessionStatsEvent,
  CpuStatsEvent,
  FilterArgsUpdateEvent,
} from '../types';
import {
  toGraphFilterData,
  buildPidsByFilter,
  buildArgsByFilter,
  toSessionFilterStats,
} from '../loader/snapshotHydrator';
import { computeBandwidthPoints } from './computeBandwidth';

type BandwidthBuffer = Record<
  string,
  { upload: ChartDataPoint[]; download: ChartDataPoint[] }
>;

export class HistoryAdapter {
  private prevBandwidth: Record<
    string,
    { bytes_sent: number; bytes_done: number; ts_us: number }
  > = {};
  private sessionStartUs = 0;
  private silent = false;
  private pendingBandwidth: BandwidthBuffer = {};
  private pendingCpuStats: CPUStats[] = [];
  private pendingLastFilters: FiltersEvent | null = null;
  private pendingLastStats: {
    stats: SessionFilterStats[];
    ts_us: number;
  } | null = null;
  private pendingFilterArgs: FilterArgsUpdateEvent[] = [];

  constructor(private dispatch: AppDispatch) {}

  setSilent(on: boolean): void {
    this.silent = on;
    if (on) {
      this.pendingBandwidth = {};
      this.pendingCpuStats = [];
      this.pendingLastFilters = null;
      this.pendingLastStats = null;
      this.pendingFilterArgs = [];
    }
  }

  flush(): void {
    this.silent = false;
    if (this.pendingLastFilters) this.handleFilters(this.pendingLastFilters);
    if (this.pendingLastStats)
      this.dispatch(updateSessionStats(this.pendingLastStats));
    for (const arg of this.pendingFilterArgs) this.handleFilterArgsUpdate(arg);
    if (Object.keys(this.pendingBandwidth).length)
      this.dispatch(bulkAddNetworkData(this.pendingBandwidth));
    if (this.pendingCpuStats.length)
      this.dispatch(bulkAddSystemStats(this.pendingCpuStats));
    this.pendingBandwidth = {};
    this.pendingCpuStats = [];
    this.pendingLastFilters = null;
    this.pendingLastStats = null;
    this.pendingFilterArgs = [];
  }

  hydrate(snapshot: HistorySnapshot, sessionStartUs: number): void {
    this.sessionStartUs = sessionStartUs;
    this.prevBandwidth = {};
    this.pendingBandwidth = {};
    this.pendingCpuStats = [];
    const { dispatch } = this;
    dispatch(resetAllData());
    dispatch(clearSessionDetails());
    dispatch(updateGraphData(snapshot.filters.map(toGraphFilterData)));
    dispatch(setCommandLine(snapshot.command_line));
    dispatch(updateSessionStats(snapshot.filters.map(toSessionFilterStats)));
    dispatch(setFilterPids(buildPidsByFilter(snapshot.filters)));
    dispatch(hydrateFilterArgs(buildArgsByFilter(snapshot.filters)));
    dispatch(setLoading(false));
  }

  handleEvent(event: HistoryEvent): void {
    switch (event.message) {
      case 'filters':
        this.handleFilters(event);
        break;
      case 'session_stats':
        this.handleSessionStats(event);
        break;
      case 'cpu_stats':
        this.handleCpuStats(event);
        break;
      case 'filter_args_update':
        this.handleFilterArgsUpdate(event);
        break;
    }
  }

  private handleFilters(event: FiltersEvent): void {
    if (this.silent) {
      this.pendingLastFilters = event;
      return;
    }
    const { dispatch } = this;
    dispatch(updateGraphData(event.filters.map(toGraphFilterData)));
    const withProps = event.filters.filter((filter) => filter.properties);
    if (withProps.length) {
      const pids = withProps.map((filter) => ({
        ...filter,
        ipids: filter.properties!.ipids,
        opids: filter.properties!.opids,
      }));
      dispatch(setFilterPids(buildPidsByFilter(pids)));
    }
    const args = buildArgsByFilter(event.filters);
    if (Object.keys(args).length) dispatch(hydrateFilterArgs(args));
  }

  private handleSessionStats(event: SessionStatsEvent): void {
    if (this.silent) {
      this.pendingLastStats = {
        stats: event.stats as SessionFilterStats[],
        ts_us: event.ts_us,
      };
    } else {
      this.dispatch(
        updateSessionStats({
          stats: event.stats as SessionFilterStats[],
          ts_us: event.ts_us,
        }),
      );
    }
    const points = computeBandwidthPoints(
      event,
      this.sessionStartUs,
      this.prevBandwidth,
    );
    if (this.silent) {
      for (const point of points) {
        if (!this.pendingBandwidth[point.filterId])
          this.pendingBandwidth[point.filterId] = { upload: [], download: [] };
        this.pendingBandwidth[point.filterId].upload.push(point.upload);
        this.pendingBandwidth[point.filterId].download.push(point.download);
      }
    } else {
      for (const point of points) {
        this.dispatch(
          addNetworkDataPoint({
            filterId: point.filterId,
            type: 'upload',
            point: point.upload,
          }),
        );
        this.dispatch(
          addNetworkDataPoint({
            filterId: point.filterId,
            type: 'download',
            point: point.download,
          }),
        );
      }
    }
  }

  private handleCpuStats(event: CpuStatsEvent): void {
    const stats: CPUStats = {
      ...event.stats,
      timestamp: event.ts_us,
      memory_usage_percent: event.stats.memory_usage_percent ?? 0,
      process_memory_percent: event.stats.process_memory_percent ?? 0,
      gpac_memory_percent: event.stats.gpac_memory_percent ?? 0,
      cpu_efficiency: event.stats.cpu_efficiency ?? 0,
    };
    if (this.silent) {
      this.pendingCpuStats.push(stats);
    } else {
      this.dispatch(setSystemStats(stats));
    }
  }

  private handleFilterArgsUpdate(event: FilterArgsUpdateEvent): void {
    if (this.silent) {
      this.pendingFilterArgs.push(event);
      return;
    }
    this.dispatch(
      applyArgUpdate({
        filterIdx: event.payload.filter_idx.toString(),
        argName: event.payload.arg_name,
        value: event.payload.value,
      }),
    );
  }
}
