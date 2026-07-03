import { GpacLogEntry } from '@/types/domain/gpac/log-types';
import type { MetricDefinitionMap } from '@/utils/metrics/metricDefinitionParser';
import type { FilterStatusInput } from '@/services/gpacService/liveAdapter/extractParsedStatuses';
import type { PIDproperties } from '@/types/domain/gpac/filter-stats';

export interface FilterStatsPayload {
  idx: number;
  ts_us?: number;
  ipids?: Record<string, PIDproperties>;
  opids?: Record<string, PIDproperties>;
  bytes_sent: number;
  bytes_done: number;
  last_task_time?: number;
}

export interface MessageHandlerCallbacks {
  onUpdateGraphData: (data: any) => void;
  onSetLoading: (loading: boolean) => void;
  onUpdateSessionStats: (stats: any) => void;
  onLogsUpdate: (logs: GpacLogEntry[]) => void;
  onLogSubscriptionChange: (isSubscribed: boolean) => void;
  onPidReconfigured: (indexes: number[]) => void;
  onArgUpdated: (indexes: number[]) => void;
  onSetMetricDefinitions: (definitions: MetricDefinitionMap) => void;
  onFilterStatuses: (entries: FilterStatusInput[]) => void;
  onUpdateFilterStats: (payload: FilterStatsPayload) => void;
  onSessionEnd?: (data: any) => void;
}

export interface MessageHandlerDependencies {
  isConnected: () => boolean;
  send: (message: any) => Promise<void>;
  stopReconnection: () => void;
  markEndOfSession: () => void;
}
