import type { AppDispatch } from '@/shared/store';
import type { CPUStats } from '@/types/domain/system';
import type { SessionFilterStats } from '@/shared/store/slices/sessionStatsSlice';
import { updateGraphData, setLoading } from '@/shared/store/slices/graphSlice';
import { resetAllData } from '@/shared/store/slices/monitoredFilterSlice';
import {
  setCommandLine,
  clearSessionDetails,
} from '@/shared/store/slices/sessionDetailsSlice';
import {
  updateSessionStats,
  setFilterPids,
} from '@/shared/store/slices/sessionStatsSlice';
import {
  applyArgUpdate,
  hydrateFilterArgs,
} from '@/shared/store/slices/filterArgumentSlice';
import { clearLogs } from '@/shared/store/slices/logsSlice';
import type {
  HistoryEvent,
  HistorySnapshot,
  FiltersEvent,
  FilterArgsUpdateEvent,
  LogEvent,
} from '../types';
import {
  toGraphFilterData,
  buildPidsByFilter,
  buildArgsByFilter,
  toSessionFilterStats,
} from '../loader/snapshotHydrator';
import {
  dispatchSessionStats,
  dispatchCpuStats,
  flushStats,
} from './handlers/statsHandler';
import type {
  BandwidthBuffer,
  PrevBandwidthState,
} from './handlers/statsHandler';
import { dispatchLogEvent } from './handlers/logHandler';

export class HistoryAdapter {
  private prevBandwidth: PrevBandwidthState = {};
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
    for (const arg of this.pendingFilterArgs) this.handleFilterArgsUpdate(arg);
    flushStats(
      this.dispatch,
      this.pendingLastStats,
      this.pendingBandwidth,
      this.pendingCpuStats,
    );
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
    dispatch(clearLogs());
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
      case 'session_stats': {
        const result = dispatchSessionStats(
          this.dispatch,
          event,
          this.sessionStartUs,
          this.prevBandwidth,
          this.silent,
          this.pendingLastStats,
          this.pendingBandwidth,
        );
        this.pendingLastStats = result.pendingStats;
        this.pendingBandwidth = result.pendingBandwidth;
        break;
      }
      case 'cpu_stats':
        dispatchCpuStats(
          this.dispatch,
          event,
          this.silent,
          this.pendingCpuStats,
        );
        break;
      case 'filter_args_update':
        this.handleFilterArgsUpdate(event);
        break;
      case 'filter_pid_reconfigured':
        if (!this.silent && event.pidsByFilter) {
          const pids: Record<
            string,
            { ipids: (typeof event.pidsByFilter)[string] }
          > = {};
          for (const [idx, ipids] of Object.entries(event.pidsByFilter)) {
            pids[idx] = { ipids };
          }
          this.dispatch(setFilterPids(pids));
        }
        break;
      case 'filter_arg_updated':
        if (!this.silent && event.argsByFilter) {
          this.dispatch(hydrateFilterArgs(event.argsByFilter));
        }
        break;
    }
  }

  handleLogEvent(event: LogEvent): void {
    if (this.silent) return;
    dispatchLogEvent(this.dispatch, event);
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
