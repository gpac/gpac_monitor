import type { AppDispatch } from '@/shared/store';
import type { CPUStats } from '@/types/domain/system';
import type { SessionFilterStats } from '@/shared/store/slices/sessionStatsSlice';
import {
  updateGraphData,
  setLoading,
  clearGraph,
  markPidReconfigured,
  markArgUpdated,
  clearPidReconfigured,
  clearArgUpdated,
} from '@/shared/store/slices/graphSlice';
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
import {
  clearLogs,
  appendLogsForAllTools,
} from '@/shared/store/slices/logsSlice';
import type {
  HistoryEvent,
  HistorySnapshot,
  FiltersEvent,
  FilterArgsUpdateEvent,
  LogEvent,
} from '../types';
import type { PIDproperties } from '@/types/domain/gpac/filter-stats';
import type { GpacArgument } from '@/types/domain/gpac/gpac_args';
import type { GpacLogEntry } from '@/types/domain/gpac/log-types';
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
import {
  MAX_LOGS_ON_SEEK,
  BADGE_WINDOW_US,
  filterRecentIndexes,
} from './utils/flushHelpers';

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
  private pendingPidTimestamps = new Map<number, number>();
  private pendingArgTimestamps = new Map<number, number>();
  private pendingPidsByFilter: Record<
    string,
    { ipids: Record<string, PIDproperties> }
  > = {};
  private pendingArgsByFilter: Record<string, GpacArgument[]> = {};
  private pendingLogEntries: GpacLogEntry[] = [];
  private pendingLastLogConfig: string | null = null;

  constructor(private dispatch: AppDispatch) {}

  setSilent(on: boolean): void {
    this.silent = on;
    if (on) {
      this.pendingBandwidth = {};
      this.pendingCpuStats = [];
      this.pendingLastFilters = null;
      this.pendingLastStats = null;
      this.pendingFilterArgs = [];
      this.pendingPidTimestamps = new Map();
      this.pendingArgTimestamps = new Map();
      this.pendingPidsByFilter = {};
      this.pendingArgsByFilter = {};
      this.pendingLogEntries = [];
      this.pendingLastLogConfig = null;
    }
  }

  flush(targetUs?: number): void {
    this.silent = false;
    if (this.pendingLastFilters) this.handleFilters(this.pendingLastFilters);
    for (const arg of this.pendingFilterArgs) this.handleFilterArgsUpdate(arg);
    flushStats(
      this.dispatch,
      this.pendingLastStats,
      this.pendingBandwidth,
      this.pendingCpuStats,
    );
    const badgeMinUs = targetUs !== undefined ? targetUs - BADGE_WINDOW_US : 0;
    const recentPidIndexes = filterRecentIndexes(this.pendingPidTimestamps, badgeMinUs);
    if (recentPidIndexes.length > 0) {
      this.dispatch(markPidReconfigured(recentPidIndexes));
    }
    if (Object.keys(this.pendingPidsByFilter).length > 0) {
      this.dispatch(setFilterPids(this.pendingPidsByFilter));
    }
    const recentArgIndexes = filterRecentIndexes(this.pendingArgTimestamps, badgeMinUs);
    if (recentArgIndexes.length > 0) {
      this.dispatch(markArgUpdated(recentArgIndexes));
    }
    if (Object.keys(this.pendingArgsByFilter).length > 0) {
      this.dispatch(hydrateFilterArgs(this.pendingArgsByFilter));
    }
    if (this.pendingLastLogConfig !== null) {
      dispatchLogEvent(this.dispatch, {
        version: 1,
        ts_us: 0,
        message: 'log_config_changed',
        logLevel: this.pendingLastLogConfig,
      });
    }
    if (this.pendingLogEntries.length > 0) {
      const logs = this.pendingLogEntries.slice(-MAX_LOGS_ON_SEEK);
      this.dispatch(appendLogsForAllTools(logs));
    }
    this.pendingBandwidth = {};
    this.pendingCpuStats = [];
    this.pendingLastFilters = null;
    this.pendingLastStats = null;
    this.pendingFilterArgs = [];
    this.pendingPidTimestamps = new Map();
    this.pendingArgTimestamps = new Map();
    this.pendingPidsByFilter = {};
    this.pendingArgsByFilter = {};
    this.pendingLogEntries = [];
    this.pendingLastLogConfig = null;
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
    dispatch(clearGraph());
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
        if (this.silent) {
          for (const idx of event.indexes) {
            this.pendingPidTimestamps.set(idx, event.ts_us);
          }
          if (event.pidsByFilter) {
            for (const [idx, ipids] of Object.entries(event.pidsByFilter)) {
              this.pendingPidsByFilter[idx] = { ipids };
            }
          }
        } else {
          this.dispatch(markPidReconfigured(event.indexes));
          if (event.pidsByFilter) {
            const pids: Record<
              string,
              { ipids: (typeof event.pidsByFilter)[string] }
            > = {};
            for (const [idx, ipids] of Object.entries(event.pidsByFilter)) {
              pids[idx] = { ipids };
            }
            this.dispatch(setFilterPids(pids));
          }
        }
        break;
      case 'filter_arg_updated':
        if (this.silent) {
          for (const idx of event.indexes) {
            this.pendingArgTimestamps.set(idx, event.ts_us);
          }
          if (event.argsByFilter) {
            for (const [idx, args] of Object.entries(event.argsByFilter)) {
              this.pendingArgsByFilter[idx] = args;
            }
          }
        } else {
          this.dispatch(markArgUpdated(event.indexes));
          if (event.argsByFilter) {
            this.dispatch(hydrateFilterArgs(event.argsByFilter));
          }
        }
        break;
    }
  }

  handleLogEvent(event: LogEvent): void {
    if (this.silent) {
      if (event.message === 'log_batch') {
        this.pendingLogEntries.push(...event.logs);
      } else if (event.message === 'log_config_changed') {
        this.pendingLastLogConfig = event.logLevel;
      }
      return;
    }
    dispatchLogEvent(this.dispatch, event);
  }

  clearExpiredBadges(
    expired: Array<{ filterIdx: number; type: 'pid' | 'arg' }>,
  ): void {
    for (const badge of expired) {
      if (badge.type === 'pid') {
        this.dispatch(clearPidReconfigured(badge.filterIdx));
      } else {
        this.dispatch(clearArgUpdated(badge.filterIdx));
      }
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
