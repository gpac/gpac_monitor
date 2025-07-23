import { WebSocketBase } from '../ws/WebSocketBase';
import { store } from '../../store';
import { setSelectedFilters, updateFilterData } from '../../store/slices/multiFilterSlice';
import { setFilterDetails, updateGraphData, setLoading } from '../../store/slices/graphSlice';
import { updateRealTimeMetrics } from '../../store/slices/filter-monitoringSlice';
import { updateSessionStats } from '../../store/slices/sessionStatsSlice';
import { IGpacCommunication, GpacMessage, IGpacCommunicationConfig, ConnectionStatus } from '../../types/communication/IgpacCommunication';
import { IGpacMessageHandler } from '../../types/communication/IGpacMessageHandler';
import { WS_CONFIG } from './config';
import { GpacNotificationHandlers } from './types';
import { ConnectionManager } from './connectionManager';
import { SubscriptionManager } from './subscriptionManager';
import { MessageHandler, MessageHandlerCallbacks } from './messageHandler';

export class GpacService implements IGpacCommunication {
  private static instance: GpacService | null = null;
  private ws: WebSocketBase;
  private currentFilterId: number | null = null;
  private messageHandlers: Set<IGpacMessageHandler> = new Set();
  
  private connectionManager: ConnectionManager;
  private subscriptionManager: SubscriptionManager;
  private messageHandler: MessageHandler;
  
  private notificationHandlers: GpacNotificationHandlers = {};
  
  public onMessage?: (message: any) => void;
  public onError?: (error: Error) => void;
  public onDisconnect?: () => void;

  private constructor(
    private readonly address: string = WS_CONFIG.address,
  ) {
    this.ws = new WebSocketBase();
    this.connectionManager = new ConnectionManager(this.ws, this.address);
    this.subscriptionManager = new SubscriptionManager(this.sendMessage.bind(this));
    
    const callbacks: MessageHandlerCallbacks = {
      onUpdateFilterData: (payload) => store.dispatch(updateFilterData(payload)),
      onUpdateRealTimeMetrics: (payload) => store.dispatch(updateRealTimeMetrics(payload)),
      onUpdateGraphData: (data) => store.dispatch(updateGraphData(data)),
      onSetLoading: (loading) => store.dispatch(setLoading(loading)),
      onSetFilterDetails: (filter) => store.dispatch(setFilterDetails(filter)),
      onUpdateSessionStats: (stats) => store.dispatch(updateSessionStats(stats))
    };
    
    this.messageHandler = new MessageHandler(
      () => this.currentFilterId,
      (idx: string) => this.subscriptionManager.hasSubscription(idx),
      this.notificationHandlers,
      callbacks,
      (message: any) => {
        this.onMessage?.(message);
        this.notifyHandlers(message);
      }
    );
    this.setupWebSocketHandlers();
  }

  public static getInstance(): GpacService {
    if (!GpacService.instance) {
      console.log('[GpacService] Creating new singleton instance');
      GpacService.instance = new GpacService();
    } else {
      console.log('[GpacService] Returning existing singleton instance');
    }
    return GpacService.instance;
  }

  public setNotificationHandlers(handlers: GpacNotificationHandlers): void {
    this.notificationHandlers = handlers;
    this.connectionManager.setNotificationHandlers(handlers);
  }

  // IGpacCommunication interface implementation
  public async connect(_config?: IGpacCommunicationConfig): Promise<void> {
    return this.connectionManager.connect();
  }

  public send(message: GpacMessage): void {
    this.sendMessage(message);
  }

  public registerHandler(handler: IGpacMessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.unregisterHandler(handler);
  }

  public unregisterHandler(handler: IGpacMessageHandler): void {
    this.messageHandlers.delete(handler);
  }

  public getStatus(): ConnectionStatus {
    return this.isConnected() ? ConnectionStatus.CONNECTED : ConnectionStatus.DISCONNECTED;
  }

  public async connectService(): Promise<void> {
    return this.connectionManager.connect();
  }

  public disconnect(): void {
    console.log('[GpacService] Initiating disconnect sequence');
    this.cleanup();
    this.connectionManager.disconnect();
    store.dispatch(setSelectedFilters([]));
    store.dispatch(setFilterDetails(null));
  }

  public isConnected(): boolean {
    return this.connectionManager.isConnected();
  }

  public sendMessage(message: GpacMessage): void {
    if (!this.ws.isConnected()) {
      throw new Error('[GpacService] WebSocket not connected');
    }
    try {
      const formattedMessage = { 
        message: message.type, 
        ...message 
      };
      const jsonString = JSON.stringify(formattedMessage);
      console.log('[GpacService] Sending message:', jsonString);
      
      this.ws.send(jsonString);
    } catch (error) {
      console.error('[GpacService] Send error:', error);
      throw error;
    }
  }

  public getFilterDetails(idx: number): void {
    if (this.currentFilterId !== null && this.currentFilterId !== idx) {
      this.sendMessage({ type: 'stop_details', idx: this.currentFilterId });
    }
    this.currentFilterId = idx;
    this.sendMessage({ type: 'get_details', idx: idx });
  }

  public setCurrentFilterId(id: number | null): void {
    console.log('[GpacService] Setting current filter ID:', id);
    this.currentFilterId = id;
  }

  public getCurrentFilterId(): number | null {
    return this.currentFilterId;
  }

  public subscribeToFilter(idx: string): void {
    this.subscriptionManager.subscribeToFilter(idx);
  }

  public unsubscribeFromFilter(idx: string): void {
    this.subscriptionManager.unsubscribeFromFilter(idx);
  }

  public subscribeToSessionStats(): void {
    this.subscriptionManager.subscribeToSessionStats();
  }

  public subscribeToCpuStats(): void {
    this.subscriptionManager.subscribeToCpuStats();
  }

  private setupWebSocketHandlers(): void {
    this.ws.addConnectHandler(() => {
      console.log('[GpacService] Connection established');
      
      this.sendMessage({ type: 'get_all_filters' });
      this.subscriptionManager.subscribeToSessionStats();
      this.subscriptionManager.subscribeToCpuStats();
    });

    this.ws.addJsonMessageHandler(this.messageHandler.handleJsonMessage.bind(this.messageHandler));
    this.ws.addDefaultMessageHandler(this.messageHandler.handleDefaultMessage.bind(this.messageHandler));

    this.ws.addDisconnectHandler(() => {
      console.log('[GpacService] Disconnected from server');
      this.onDisconnect?.();
      this.connectionManager.handleDisconnect();
    });
  }

  private cleanup(): void {
    this.currentFilterId = null;
    this.subscriptionManager.clearSubscriptions();
  }

  private notifyHandlers(message: any): void {
    this.messageHandlers.forEach(handler => {
      try {
        handler.onMessage?.(message);
      } catch (error) {
        console.error('[GpacService] Handler error:', error);
        handler.onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }
}

export const gpacService = GpacService.getInstance();