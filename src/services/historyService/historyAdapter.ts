import type { AppDispatch } from '@/shared/store';
import { updateGraphData, setLoading } from '@/shared/store/slices/graphSlice';
import {
  resetAllData,
  addNetworkDataPoint,
} from '@/shared/store/slices/monitoredFilterSlice';
import {
  setCommandLine,
  clearSessionDetails,
  setSystemStats,
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
import { formatCompactTime } from '@/utils/formatting';
import type {
  HistoryEvent,
  HistorySnapshot,
  FiltersEvent,
  SessionStatsEvent,
  CpuStatsEvent,
  FilterArgsUpdateEvent,
} from './types';
import {
  toGraphFilterData,
  buildPidsByFilter,
  buildArgsByFilter,
  toSessionFilterStats,
} from './loader/snapshotHydrator';

type BandwidthRef = { bytes_sent: number; bytes_done: number; ts_us: number };

/**
 * HistoryAdapter — unique boundary Redux pour historyService.
 * Miroir de storeIntegration.ts côté gpacService.
 * Absorbe : eventDispatcher, bandwidthReplay, hydrateFromSnapshot.
 */
export class HistoryAdapter {
  private prevBandwidth: Record<string, BandwidthRef> = {};
  private sessionStartUs = 0;

  constructor(private dispatch: AppDispatch) {}

  hydrate(snapshot: HistorySnapshot, sessionStartUs: number): void {
    this.sessionStartUs = sessionStartUs;
    this.prevBandwidth = {};
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
    const { dispatch } = this;
    dispatch(updateGraphData(event.filters.map(toGraphFilterData)));
    const withProps = event.filters.filter((f) => f.properties);
    if (withProps.length) {
      const pids = withProps.map((f) => ({
        ...f,
        ipids: f.properties!.ipids,
        opids: f.properties!.opids,
      }));
      dispatch(setFilterPids(buildPidsByFilter(pids)));
    }
    const args = buildArgsByFilter(event.filters);
    if (Object.keys(args).length) dispatch(hydrateFilterArgs(args));
  }

  private handleSessionStats(event: SessionStatsEvent): void {
    this.dispatch(
      updateSessionStats({
        stats: event.stats as SessionFilterStats[],
        ts_us: event.ts_us,
      }),
    );
    this.dispatchBandwidthPoints(event);
  }

  private handleCpuStats(event: CpuStatsEvent): void {
    this.dispatch(
      setSystemStats({
        ...event.stats,
        timestamp: event.ts_us,
        memory_usage_percent: event.stats.memory_usage_percent ?? 0,
        process_memory_percent: event.stats.process_memory_percent ?? 0,
        gpac_memory_percent: event.stats.gpac_memory_percent ?? 0,
        cpu_efficiency: event.stats.cpu_efficiency ?? 0,
      }),
    );
  }

  private handleFilterArgsUpdate(event: FilterArgsUpdateEvent): void {
    this.dispatch(
      applyArgUpdate({
        filterIdx: event.payload.filter_idx.toString(),
        argName: event.payload.arg_name,
        value: event.payload.value,
      }),
    );
  }

  private dispatchBandwidthPoints(evt: SessionStatsEvent): void {
    const time = formatCompactTime(evt.ts_us - this.sessionStartUs);
    for (const filter of evt.stats) {
      const filterId = filter.idx.toString();
      const prev = this.prevBandwidth[filterId];
      if (!prev) {
        this.dispatch(
          addNetworkDataPoint({
            filterId,
            type: 'upload',
            point: { time, timestamp: evt.ts_us, value: 0 },
          }),
        );
        this.dispatch(
          addNetworkDataPoint({
            filterId,
            type: 'download',
            point: { time, timestamp: evt.ts_us, value: 0 },
          }),
        );
      } else {
        const dt = (evt.ts_us - prev.ts_us) / 1_000_000;
        if (dt > 0) {
          const up = Math.max(
            0,
            ((filter.bytes_sent ?? 0) - prev.bytes_sent) / dt,
          );
          const down = Math.max(
            0,
            ((filter.bytes_done ?? 0) - prev.bytes_done) / dt,
          );
          this.dispatch(
            addNetworkDataPoint({
              filterId,
              type: 'upload',
              point: { time, timestamp: evt.ts_us, value: up },
            }),
          );
          this.dispatch(
            addNetworkDataPoint({
              filterId,
              type: 'download',
              point: { time, timestamp: evt.ts_us, value: down },
            }),
          );
        }
      }
      this.prevBandwidth[filterId] = {
        bytes_sent: filter.bytes_sent ?? 0,
        bytes_done: filter.bytes_done ?? 0,
        ts_us: evt.ts_us,
      };
    }
  }
}
