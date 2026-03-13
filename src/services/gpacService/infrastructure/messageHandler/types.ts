import { GpacLogEntry } from '@/types/domain/gpac/log-types';
import type { CPUStats } from '@/types/domain/system';

export interface MessageHandlerCallbacks {
  onUpdateGraphData: (data: any) => void;
  onSetLoading: (loading: boolean) => void;
  onUpdateSessionStats: (stats: any) => void;
  onLogsUpdate: (logs: GpacLogEntry[]) => void;
  onLogSubscriptionChange: (isSubscribed: boolean) => void;
  onSessionEnd?: (data: any) => void;
  onUpdateCpuStats?: (stats: CPUStats) => void;
  onUpdateCommandLine?: (commandLine: string | null) => void;
}

export interface MessageHandlerDependencies {
  isConnected: () => boolean;
  send: (message: any) => Promise<void>;
  stopReconnection: () => void;
  markEndOfSession: () => void;
}
