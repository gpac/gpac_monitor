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
import { GpacLogConfig } from '@/types/domain/gpac/log-types';

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
      /*    () => this.coreService.getCurrentFilterId(), */
      () => false,
      this.notificationHandlers,
      storeCallbacks,
      dependencies,
      (message: any) => {
        this.onMessage?.(message);
        this.coreService.notifyHandlers(message);
      },
    );

    this.setupWebSocketHandlers();
  }
  public static getInstance(): GpacService {
    if (!GpacService.instance) {
      GpacService.instance = new GpacService();
    }
    return GpacService.instance;
  }

  public async load(): Promise<boolean> {
    if (this._isLoaded) {
      return true;
    }

    try {
      await this.connectionManager.connect();
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!this.isConnected()) {
        throw new Error('Failed to establish connection');
      }

      this._isLoaded = true;

      return true;
    } catch (error) {
      this._isLoaded = false;
      throw error;
    }
  }

  public setNotificationHandlers(handlers: GpacNotificationHandlers): void {
    this.notificationHandlers = handlers;
    this.connectionManager.setNotificationHandlers(handlers);
  }

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

    const formattedMessage = {
      message: message.type,
      ...message,
    };
    const jsonString = JSON.stringify(formattedMessage);
    this.ws.send(jsonString);
  }

  public getFilterDetails(idx: number): void {
    const currentFilterId = this.coreService.getCurrentFilterId();
    if (currentFilterId !== null && currentFilterId !== idx) {
      this.sendMessage({ type: 'stop_details', idx: currentFilterId });
    }
    this.coreService.setCurrentFilterId(idx);
    this.sendMessage({ type: 'filter_args_details', idx: idx });
  }

  public setCurrentFilterId(id: number | null): void {
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

  /**
   * Update a filter argument
   */
  public async updateFilterArg(
    idx: number,
    name: string,
    argName: string,
    newValue: string | number | boolean,
  ): Promise<void> {
    if (!this.isLoaded()) {
      throw new Error('Service not loaded');
    }

    return this.messageHandler
      .getFilterArgsHandler()
      .updateFilterArg(idx, name, argName, newValue);
  }

  private setupWebSocketHandlers(): void {
    this.ws.addConnectHandler(() => {
      this.sendMessage({ type: 'get_all_filters' });
    });

    this.ws.addJsonMessageHandler(
      this.messageHandler.handleJsonMessage.bind(this.messageHandler),
    );
    this.ws.addDefaultMessageHandler(
      this.messageHandler.handleDefaultMessage.bind(this.messageHandler),
    );

    this.ws.addDisconnectHandler(() => {
      this._isLoaded = false;
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
    if (!this.isLoaded()) {
      throw new Error('Service not loaded');
    }

    const subscriptionId = generateID();

    switch (config.type) {
      case SubscriptionType.SESSION_STATS:
        return this.messageHandler
          .getSessionStatsHandler()
          .subscribeToSessionStats((data) => {
            callback({
              data: data as T,
              timestamp: Date.now(),
              subscriptionId,
            });
          }, config.interval || 1000);

      case SubscriptionType.FILTER_STATS:
        if (config.filterIdx === undefined) {
          throw new Error(
            'filterIdx is required for FILTER_STATS subscription',
          );
        }
        return this.messageHandler
          .getFilterStatsHandler()
          .subscribeToFilterStatsUpdates(
            config.filterIdx,
            (data) => {
              callback({
                data: data as T,
                timestamp: Date.now(),
                subscriptionId,
              });
            },
            config.interval || 1000,
          );

      case SubscriptionType.CPU_STATS:
        return this.messageHandler
          .getCPUStatsHandler()
          .subscribeToCPUStatsUpdates((data) => {
            callback({
              data: data as T,
              timestamp: Date.now(),
              subscriptionId,
            });
          }, config.interval || 150);

      case SubscriptionType.LOGS:
        return this.messageHandler
          .getLogHandler()
          .subscribeToLogEntries((data) => {
            callback({
              data: data as T,
              timestamp: Date.now(),
              subscriptionId,
            });
          }, (config.logLevel as GpacLogConfig) || 'all@warning');

      case SubscriptionType.FILTER_ARGS_DETAILS:
        if (typeof config.filterIdx !== 'number') {
          throw new Error(
            'filterIdx is required for FILTER_ARGS_DETAILS subscription',
          );
        }
        return this.messageHandler
          .getFilterArgsHandler()
          .subscribeToFilterArgsDetails(
            config.filterIdx,
            (data) => {
              callback({
                data: data as T,
                timestamp: Date.now(),
                subscriptionId,
              });
            },
            config.interval || 1000,
          );

      default:
        throw new Error(`Unsupported subscription type: ${config.type}`);
    }
  }
}

export const gpacService = GpacService.getInstance();
