import { GpacNodeData } from '../../../types/domain/gpac/model';

export interface GpacNotificationHandlers {
  onError?: (error: Error) => void;
  onFilterUpdate?: (filter: GpacNodeData) => void;
  onConnectionStatus?: (connected: boolean) => void;
}
