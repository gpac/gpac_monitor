import { WebSocketBase } from '../ws/WebSocketBase';
import {
  IGpacCommunication,
  GpacMessage,
  IGpacCommunicationConfig,
  ConnectionStatus,
} from '../../types/communication/IgpacCommunication';
import { IGpacMessageHandler } from '../../types/communication/IGpacMessageHandler';
import { WS_CONFIG } from './config';
import { GpacNotificationHandlers } from './types';
import { ConnectionManager } from './infrastructure/connectionManager';
import { BaseMessageHandler } from './infrastructure/messageHandler/baseMessageHandler';
import { GpacCoreService } from './core/gpacCore';
import {
  createStoreCallbacks,
  clearStoreFilters,
} from './integration/storeIntegration';
import { generateID } from '@/utils/id';
import {
  SubscriptionCallback,
  SubscriptionConfig,
  SubscriptionType,
} from '@/types/communication/subscription';

export class GpacService implements IGpacCommunication {
  private static instance: GpacService | null = null;
  private ws: WebSocketBase;
  private coreService: GpacCoreService;

  private connectionManager: ConnectionManager;
  private messageHandler: BaseMessageHandler;

  private notificationHandlers: GpacNotificationHandlers = {};
  private _isLoaded: boolean = false;

  public onMessage?: (message: any) => void;
  public onError?: (error: Error) => void;
  public onDisconnect?: () => void;

  private constructor(private readonly address: string = WS_CONFIG.address) {
    this.ws = new WebSocketBase();
    this.coreService = new GpacCoreService();
    this.connectionManager = new ConnectionManager(this.ws, this.address);

    const storeCallbacks = createStoreCallbacks();

    const dependencies = {
      isConnected: () => this.isConnected(),
      send: (message: any) => this.send(message),
    };

    this.messageHandler = new BaseMessageHandler(
      () => this.coreService.getCurrentFilterId(),
      () => false,
      this.notificationHandlers,
      storeCallbacks,
      dependencies,
      (message: any) => {
        this.onMessage?.(message);
        this.coreService.notifyHandlers(message);
      },
      () => this.isLoaded(),
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

  public async load(): Promise<boolean> {
    console.log('[GpacService] Starting load process');

    if (this._isLoaded) {
      console.log('[GpacService] Service already loaded');
      return true;
    }

    try {
      // Wait for connection to be established
      await this.connectionManager.connect();

      // Wait a bit for the service to be fully initialized
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!this.isConnected()) {
        throw new Error('Failed to establish connection');
      }

      // Service is now loaded and ready
      this._isLoaded = true;
      console.log('[GpacService] Service successfully loaded and ready');

      return true;
    } catch (error) {
      console.error('[GpacService] Failed to load service:', error);
      this._isLoaded = false;
      throw error;
    }
  }

  public setNotificationHandlers(handlers: GpacNotificationHandlers): void {
    this.notificationHandlers = handlers;
    this.connectionManager.setNotificationHandlers(handlers);
  }

  // IGpacCommunication interface implementation
  public async connect(_config?: IGpacCommunicationConfig): Promise<void> {
    return this.connectionManager.connect();
  }

  public send(message: GpacMessage): Promise<void> {
    return Promise.resolve(this.sendMessage(message));
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

  public isLoaded(): boolean {
    return this._isLoaded && this.isConnected();
  }

  public sendMessage(message: GpacMessage): void {
    if (!this.ws.isConnected()) {
      throw new Error('[GpacService] WebSocket not connected');
    }
    try {
      const formattedMessage = {
        message: message.type,
        ...message,
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

  public unsubscribeFromFilter(filterIdx: string): void {
    const numericIdx = parseInt(filterIdx, 10);
    if (!isNaN(numericIdx)) {
      this.sendMessage({ type: 'stop_details', idx: numericIdx });
    }
  }

  private setupWebSocketHandlers(): void {
    this.ws.addConnectHandler(() => {
      console.log('[GpacService] Connection established');

      this.sendMessage({ type: 'get_all_filters' });
    });

    this.ws.addJsonMessageHandler(
      this.messageHandler.handleJsonMessage.bind(this.messageHandler),
    );
    this.ws.addDefaultMessageHandler(
      this.messageHandler.handleDefaultMessage.bind(this.messageHandler),
    );

    this.ws.addDisconnectHandler(() => {
      console.log('[GpacService] Disconnected from server');
      this._isLoaded = false;
      console.log('[GpacService] Service marked as not loaded');
      this.onDisconnect?.();
      this.connectionManager.handleDisconnect();
    });
  }

  private cleanup(): void {
    this.coreService.setCurrentFilterId(null);
  }
  public async subscribe<T = unknown>(
    config: SubscriptionConfig,
    callback: SubscriptionCallback<T>,
  ): Promise<() => void> {
    console.log('[GpacService] subscribe called with config:', config);
    console.log(
      '[GpacService] Service status - isLoaded:',
      this.isLoaded(),
      'isConnected:',
      this.isConnected(),
    );

    if (!this.isLoaded()) {
      console.error('[GpacService] Cannot subscribe - service not loaded');
      throw new Error('Service not loaded');
    }

    const subscriptionId = generateID();
    console.log('[GpacService] Generated subscription ID:', subscriptionId);

    switch (config.type) {
      case SubscriptionType.SESSION_STATS:
        console.log(
          '[GpacService] Setting up SESSION_STATS subscription with interval:',
          config.interval || 1000,
        );
        return this.messageHandler
          .getSessionStatsHandler()
          .subscribeToSessionStats((data) => {
            console.log(
              '[GpacService] Received session stats data from handler, forwarding to hook callback:',
              data,
            );
            callback({
              data: data as T,
              timestamp: Date.now(),
              subscriptionId,
            });
          }, config.interval || 1000);

      default:
        console.error(
          '[GpacService] Unsupported subscription type:',
          config.type,
        );
        throw new Error(`Unsupported subscription type: ${config.type}`);
    }
  }
}

export const gpacService = GpacService.getInstance();
