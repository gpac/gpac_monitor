import type { GpacArgument } from '@/types/domain/gpac/gpac_args';
import type { PIDproperties } from '@/types/domain/gpac/filter-stats';

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
