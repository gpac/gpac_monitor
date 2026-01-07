import { WebSocketBase } from '../../ws/WebSocketBase';
import { ConnectionStatus } from '../../../types/communication/IgpacCommunication';
import { GpacNotificationHandlers } from '../types';
import { ConnectionManager } from '../infrastructure/connectionManager';
import { BaseMessageHandler } from '../infrastructure/messageHandler/baseMessageHandler';
import { GpacCoreService } from '../core/gpacCore';
import { FilterSubscriptionsStore } from '../monitored-filter/FilterSubscriptionStore';

/** Internal state for GpacService */
export interface GpacServiceState {
  ws: WebSocketBase;
  coreService: GpacCoreService;
  connectionManager: ConnectionManager;
  messageHandler: BaseMessageHandler;
  notificationHandlers: GpacNotificationHandlers;
  filterSubscriptionsStore: FilterSubscriptionsStore;
  isLoaded: boolean;
  readyPromise: Promise<void> | null;
}

/** Public callbacks for GpacService events */
export interface GpacServiceCallbacks {
  onMessage?: (message: any) => void;
  onError?: (error: Error) => void;
  onDisconnect?: () => void;
  onConnectionStatusChange?: (status: ConnectionStatus) => void;
}
