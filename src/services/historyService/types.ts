import type {
  GpacArgument,
  GpacArgumentValue,
} from '@/types/domain/gpac/gpac_args';
import type { PIDproperties } from '@/types/domain/gpac/filter-stats';
import type { SessionFilterStatistics } from '@/types/domain/gpac/filter-stats';

// --- History Events ---

interface BaseEvent {
  version: number;
  ts_us: number;
}

export interface FiltersEvent extends BaseEvent {
  message: 'filters';
  graph_v: number;
  filters: HistorySnapshotFilter[];
}

export interface SessionStatsEvent extends BaseEvent {
  message: 'session_stats';
  all_packets_done: boolean;
  stats: SessionFilterStatistics[];
}

export interface CpuStatsRawPayload {
  total_cpu_usage: number;
  process_cpu_usage: number;
  process_memory: number;
  physical_memory: number;
  physical_memory_avail: number;
  gpac_memory: number;
  nb_cores: number;
  thread_count: number;
}

export interface CpuStatsEvent extends BaseEvent {
  message: 'cpu_stats';
  stats: CpuStatsRawPayload;
}

export interface FilterArgsUpdateEvent extends BaseEvent {
  message: 'filter_args_update';
  payload: {
    filter_idx: number;
    arg_name: string;
    value: GpacArgumentValue;
  };
}

export type HistoryEvent =
  | FiltersEvent
  | SessionStatsEvent
  | CpuStatsEvent
  | FilterArgsUpdateEvent;

export interface HistorySnapshotFilter {
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
  [key: string]: unknown;
}

export interface HistorySnapshot {
  version: number;
  ts_us: number;
  command_line: string | null;
  graph_v: number;
  filters: HistorySnapshotFilter[];
}
