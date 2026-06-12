import { GpacLogEntry } from '@/types/domain/gpac/log-types';
import type { CPUStats } from '@/types/domain/system';
import type { GraphFilterData } from '@/types/domain/gpac';
import type { SessionFilterStats } from '@/shared/store/slices/sessionStatsSlice';
import type { GpacMessage } from '@/types/communication/shared';

export interface MessageHandlerCallbacks {
  onUpdateGraphData: (data: GraphFilterData[]) => void;
  onSetLoading: (loading: boolean) => void;
  onUpdateSessionStats: (
    stats:
      | SessionFilterStats[]
      | { stats: SessionFilterStats[]; ts_us?: number },
  ) => void;
  onLogsUpdate: (logs: GpacLogEntry[]) => void;
  onLogSubscriptionChange: (isSubscribed: boolean) => void;
  onSessionEnd?: (data: unknown) => void;
  onUpdateCpuStats?: (stats: CPUStats) => void;
  onUpdateCommandLine?: (commandLine: string | null) => void;
  onPidReconfigured: (indexes: number[]) => void;
  onArgUpdated: (indexes: number[]) => void;
  onSetMetricDefinitions: (raw: string) => void;
}

export interface MessageHandlerDependencies {
  isConnected: () => boolean;
  send: (message: GpacMessage) => Promise<void>;
  stopReconnection: () => void;
  markEndOfSession: () => void;
}
