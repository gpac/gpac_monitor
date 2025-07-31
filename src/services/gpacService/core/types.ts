import { GpacNodeData } from '../../../types/domain/gpac/model';

export interface GpacNotificationHandlers {
  onError?: (error: Error) => void;
  onFilterUpdate?: (filter: GpacNodeData) => void;
  onConnectionStatus?: (connected: boolean) => void;
}

export interface GpacCallbacks {
  onMessage?: (message: any) => void;
  onError?: (error: Error) => void;
  onDisconnect?: () => void;
}
