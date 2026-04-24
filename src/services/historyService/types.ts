import type {
  GpacArgument,
  GpacArgumentValue,
} from '@/types/domain/gpac/gpac_args';
import type { PIDproperties } from '@/types/domain/gpac/filter-stats';
import type { SessionFilterStatistics } from '@/types/domain/gpac/filter-stats';
import type { GpacLogEntry } from '@/types/domain/gpac/log-types';

// --- History Events ---

interface BaseEvent {
  version: number;
  ts_us: number;
}

export interface FiltersEvent extends BaseEvent {
  message: 'filters';
  graph_v: number;
  filters: HistoryFilter[];
}

export interface SessionStatsEvent extends BaseEvent {
  message: 'session_stats';
  all_packets_done: boolean;
  stats: SessionFilterStatistics[];
}

/** Direct GPAC sys fields — source of truth */
export interface CpuStatsRawPayload {
  total_cpu_usage: number; // percent [0..100]
  process_cpu_usage: number; // percent [0..100]
  process_memory: number; // bytes
  physical_memory: number; // bytes
  physical_memory_avail: number; // bytes
  gpac_memory: number; // bytes
  nb_cores: number;
  thread_count: number;
}

/** Derived fields computed server-side in buildCpuStatsPayload.
 *  Always present in current recordings (default 0), optional for older files. */
export interface CpuStatsComputed {
  memory_usage_percent?: number; // percent [0..100]
  process_memory_percent?: number;
  gpac_memory_percent?: number;
  cpu_efficiency?: number; // process_cpu / total_cpu * 100
}

export interface CpuStatsEvent extends BaseEvent {
  message: 'cpu_stats';
  stats: CpuStatsRawPayload & CpuStatsComputed;
}

export interface FilterArgsUpdateEvent extends BaseEvent {
  message: 'filter_args_update';
  payload: {
    filter_idx: number;
    arg_name: string;
    value: GpacArgumentValue;
  };
}

export interface LogBatchEvent extends BaseEvent {
  message: 'log_batch';
  logs: GpacLogEntry[];
}

export interface LogConfigChangedEvent extends BaseEvent {
  message: 'log_config_changed';
  logLevel: string;
}

export interface PidReconfiguredEvent extends BaseEvent {
  message: 'filter_pid_reconfigured';
  indexes: number[];
  pidsByFilter?: Record<string, Record<string, PIDproperties>>;
}

export interface ArgUpdatedEvent extends BaseEvent {
  message: 'filter_arg_updated';
  indexes: number[];
  argsByFilter?: Record<string, GpacArgument[]>;
}

/** Main history events (stored in chunks/) */
export type HistoryEvent =
  | FiltersEvent
  | SessionStatsEvent
  | CpuStatsEvent
  | FilterArgsUpdateEvent
  | PidReconfiguredEvent
  | ArgUpdatedEvent;

export const STRUCTURAL_MESSAGES = new Set([
  'filters',
  'filter_args_update',
  'filter_pid_reconfigured',
  'filter_arg_updated',
] as const);

export function isStructuralEvent(event: HistoryEvent): boolean {
  return (STRUCTURAL_MESSAGES as Set<string>).has(event.message);
}

/** Log events (stored separately in logs.jsonl) */
export type LogEvent = LogBatchEvent | LogConfigChangedEvent;

export interface HistoryFilter {
  idx: number;
  name: string;
  type: string;
  status: string;
  itag?: string | null;
  ID?: string | null;
  nb_ipid: number;
  nb_opid: number;
  ipids?: Record<string, PIDproperties>;
  opids?: Record<string, PIDproperties>;
  gpac_args?: GpacArgument[];
  properties?: {
    ipids: Record<string, PIDproperties>;
    opids: Record<string, PIDproperties>;
  };
  [key: string]: unknown;
}

export interface HistorySnapshot {
  version: number;
  ts_us: number;
  command_line: string | null;
  graph_v: number;
  filters: HistoryFilter[];
}

export type HistoryCheckpoint = Pick<
  HistorySnapshot,
  'version' | 'ts_us' | 'graph_v' | 'filters'
> & {
  pid_state?: Record<string, Record<string, PIDproperties>>;
  arg_state?: Record<string, GpacArgument[]>;
};
