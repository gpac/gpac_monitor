import { WebSocketBase } from '../ws/WebSocketBase';
import { IGpacCommunication, GpacMessage, IGpacCommunicationConfig, ConnectionStatus } from '../../types/communication/IgpacCommunication';
import { IGpacMessageHandler } from '../../types/communication/IGpacMessageHandler';
import { WS_CONFIG } from './config';
import { GpacNotificationHandlers } from './types';
import { ConnectionManager } from './infrastructure/connectionManager';
import { SubscriptionManager } from './infrastructure/subscriptionManager';
import { MessageHandler } from './infrastructure/messageHandler';
import { GpacCoreService } from './core/gpacCore';
import { createStoreCallbacks, clearStoreFilters } from './integration/storeIntegration';

export class GpacService implements IGpacCommunication {
  private static instance: GpacService | null = null;
  private ws: WebSocketBase;
  private coreService: GpacCoreService;
  
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
    this.coreService = new GpacCoreService();
    this.connectionManager = new ConnectionManager(this.ws, this.address);
    this.subscriptionManager = new SubscriptionManager(this.sendMessage.bind(this));
    
    const storeCallbacks = createStoreCallbacks();
    
    this.messageHandler = new MessageHandler(
      () => this.coreService.getCurrentFilterId(),
      (idx: string) => this.subscriptionManager.hasSubscription(idx),
      this.notificationHandlers,
      storeCallbacks,
      (message: any) => {
        this.onMessage?.(message);
        this.coreService.notifyHandlers(message);
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
    return this.coreService.registerHandler(handler);
  }

  public unregisterHandler(handler: IGpacMessageHandler): void {
    this.coreService.unregisterHandler(handler);
  }

  public getStatus(): ConnectionStatus {
    return this.coreService.getStatus();
  }

  public async connectService(): Promise<void> {
    return this.connectionManager.connect();
  }

  public disconnect(): void {
    console.log('[GpacService] Initiating disconnect sequence');
    this.cleanup();
    this.connectionManager.disconnect();
    clearStoreFilters();
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
    const currentFilterId = this.coreService.getCurrentFilterId();
    if (currentFilterId !== null && currentFilterId !== idx) {
      this.sendMessage({ type: 'stop_details', idx: currentFilterId });
    }
    this.coreService.setCurrentFilterId(idx);
    this.sendMessage({ type: 'get_details', idx: idx });
  }

  public setCurrentFilterId(id: number | null): void {
    console.log('[GpacService] Setting current filter ID:', id);
    this.coreService.setCurrentFilterId(id);
  }

  public getCurrentFilterId(): number | null {
    return this.coreService.getCurrentFilterId();
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
    this.coreService.setCurrentFilterId(null);
    this.subscriptionManager.clearSubscriptions();
  }
}

export const gpacService = GpacService.getInstance();