import { GpacLogEntry } from '@/types/domain/gpac/log-types';

export interface MessageHandlerCallbacks {
  onUpdateGraphData: (data: any) => void;
  onSetLoading: (loading: boolean) => void;
  onUpdateSessionStats: (stats: any) => void;
  onLogsUpdate: (logs: GpacLogEntry[]) => void;
  onLogSubscriptionChange: (isSubscribed: boolean) => void;
}

export interface MessageHandlerDependencies {
  isConnected: () => boolean;
  send: (message: any) => Promise<void>;
}
