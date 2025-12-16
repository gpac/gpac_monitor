import { WebSocketBase } from '../ws/WebSocketBase';
import {
  IGpacCommunication,
  GpacMessage,
  ConnectionStatus,
} from '../../types/communication/IgpacCommunication';
import { IGpacMessageHandler } from '../../types/communication/IGpacMessageHandler';
import { GpacNotificationHandlers } from './types';
import { ConnectionManager } from './infrastructure/connectionManager';
import { BaseMessageHandler } from './infrastructure/messageHandler/baseMessageHandler';
import { GpacCoreService } from './core/gpacCore';
import {
  createStoreCallbacks,
  clearStoreFilters,
} from './integration/storeIntegration';
import { generateID } from '@/utils/core';
import {
  SubscriptionCallback,
  SubscriptionConfig,
  SubscriptionType,
} from '@/types/communication/subscription';
import { GpacLogConfig } from '@/types/domain/gpac/log-types';
import { PidProperty } from '@/types';
import { FilterSubscriptionsStore } from './monitored-filter/FilterSubscriptionStore';

export class GpacService implements IGpacCommunication {
  // ============================================================================
  // SINGLETON & PROPERTIES
  // ============================================================================
  private static instance: GpacService | null = null;
  private ws: WebSocketBase;
  private coreService: GpacCoreService;
  private connectionManager: ConnectionManager;
  private messageHandler: BaseMessageHandler;
  private notificationHandlers: GpacNotificationHandlers = {};
  private _isLoaded: boolean = false;
  private _readyPromise: Promise<void> | null = null;
  private filterSubscriptionsStore = new FilterSubscriptionsStore();

  public onMessage?: (message: any) => void;
  public onError?: (error: Error) => void;
  public onDisconnect?: () => void;
  public onConnectionStatusChange?: (status: ConnectionStatus) => void;

  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  private constructor() {
    this.ws = new WebSocketBase();
    this.coreService = new GpacCoreService();
    this.connectionManager = new ConnectionManager(this.ws);

    const storeCallbacks = createStoreCallbacks();

    const dependencies = {
      isConnected: () => this.isConnected(),
      send: (message: any) => this.send(message),
      stopReconnection: () => this.connectionManager.stopReconnection(),
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

  public async load(address: string): Promise<boolean> {
    if (this._isLoaded) {
      return true;
    }

    try {
      this.onConnectionStatusChange?.(ConnectionStatus.CONNECTING);
      await this.connectionManager.connect(address);
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!this.isConnected()) {
        throw new Error('Failed to establish connection');
      }

      this._isLoaded = true;

      return true;
    } catch (error) {
      this._isLoaded = false;
      this.onConnectionStatusChange?.(ConnectionStatus.ERROR);
      throw error;
    }
  }

  private setupWebSocketHandlers(): void {
    this.ws.addConnectHandler(() => {
      this.sendMessage({ type: 'get_all_filters' });
      this.onConnectionStatusChange?.(ConnectionStatus.CONNECTED);
    });

    this.ws.addJsonMessageHandler(
      this.messageHandler.handleJsonMessage.bind(this.messageHandler),
    );
    this.ws.addDefaultMessageHandler(
      this.messageHandler.handleDefaultMessage.bind(this.messageHandler),
    );

    this.ws.addDisconnectHandler(() => {
      this._isLoaded = false;
      this._readyPromise = null;
      this.messageHandler.cleanup();
      this.onConnectionStatusChange?.(ConnectionStatus.DISCONNECTED);
      this.onDisconnect?.();
      this.connectionManager.handleDisconnect();
    });
  }

  private cleanup(): void {
    this.coreService.setCurrentFilterId(null);
    this.filterSubscriptionsStore.clear();
  }

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================
  public async connect(address: string): Promise<void> {
    return this.connectionManager.connect(address);
  }

  public async connectService(address: string): Promise<void> {
    return this.connectionManager.connect(address);
  }

  public disconnect(): void {
    console.log('[GpacService] Disconnecting service');
    this.cleanup();
    this.messageHandler.cleanup();
    this.connectionManager.disconnect();
    clearStoreFilters();
  }

  public isConnected(): boolean {
    return this.connectionManager.isConnected();
  }

  public isLoaded(): boolean {
    return this._isLoaded && this.isConnected();
  }

  public ready(address: string): Promise<void> {
    if (!this._readyPromise) {
      this._readyPromise = this.load(address).then(() => {});
    }
    return this._readyPromise;
  }

  public getStatus(): ConnectionStatus {
    return this.coreService.getStatus();
  }

  // ============================================================================
  // MESSAGE HANDLING
  // ============================================================================
  public send(message: GpacMessage): Promise<void> {
    return Promise.resolve(this.sendMessage(message));
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

  public registerHandler(handler: IGpacMessageHandler): () => void {
    return this.coreService.registerHandler(handler);
  }

  public unregisterHandler(handler: IGpacMessageHandler): void {
    this.coreService.unregisterHandler(handler);
  }

  public setNotificationHandlers(handlers: GpacNotificationHandlers): void {
    this.notificationHandlers = handlers;
    this.connectionManager.setNotificationHandlers(handlers);
  }

  // ============================================================================
  // FILTER OPERATIONS
  // ============================================================================
  public getFilterDetails(idx: number): void {
    const currentFilterId = this.coreService.getCurrentFilterId();
    if (currentFilterId !== null && currentFilterId !== idx) {
      this.sendMessage({ type: 'stop_details', idx: currentFilterId });
    }
    this.coreService.setCurrentFilterId(idx);
    this.sendMessage({
      type: 'filter_args_details',
      id: generateID(),
      idx: idx,
    });
  }

  public setCurrentFilterId(id: number | null): void {
    this.coreService.setCurrentFilterId(id);
  }

  public getCurrentFilterId(): number | null {
    return this.coreService.getCurrentFilterId();
  }

  public async subscribeToFilterArgs(idx: number): Promise<void> {
    return this.messageHandler
      .getFilterArgsHandler()
      .subscribeToFilterArgs(idx);
  }

  public unsubscribeFromFilter(filterIdx: string): void {
    const numericIdx = parseInt(filterIdx, 10);
    if (!isNaN(numericIdx)) {
      this.sendMessage({ type: 'stop_details', idx: numericIdx });
    }
  }

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

  public getFilterArgsHandler() {
    return this.messageHandler.getFilterArgsHandler();
  }

  public get filterSubscriptions() {
    return this.filterSubscriptionsStore;
  }

  // ============================================================================
  // PID FETCHING
  // ============================================================================
  public async getPidProps(
    filterIdx: number | undefined,
    ipidIdx: number | undefined,
  ): Promise<PidProperty[]> {
    if (!this.isLoaded()) {
      throw new Error('Service not loaded');
    }
    if (typeof filterIdx !== 'number' || typeof ipidIdx !== 'number') {
      throw new Error('filterIdx and ipidIdx must be numbers');
    }
    const pidPropsMap = await this.messageHandler
      .getPidPropsHandler()
      .fetchIpidProps(filterIdx, ipidIdx);
    return Object.values(pidPropsMap);
  }

  public async getCommandLine(): Promise<string | null> {
    if (!this.isLoaded()) {
      throw new Error('Service not loaded');
    }
    return this.messageHandler.getCommandLineHandler().fetch();
  }

  // ============================================================================
  // LOGS
  // ============================================================================
  public get logs() {
    return this.messageHandler.getLogHandler();
  }

  // ============================================================================
  // SUBSCRIPTIONS
  // ============================================================================
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
          });

      case SubscriptionType.FILTER_STATS: {
        if (config.filterIdx === undefined) {
          throw new Error(
            'filterIdx is required for FILTER_STATS subscription',
          );
        }
        const filterIdx = config.filterIdx;
        this.filterSubscriptionsStore.addFilter(filterIdx);
        const unsubscribeFromFilterStats = this.messageHandler
          .getFilterStatsHandler()
          .subscribeToFilterStatsUpdates(filterIdx, (data) => {
            callback({
              data: data as T,
              timestamp: Date.now(),
              subscriptionId,
            });
          });
        return () => {
          this.filterSubscriptionsStore.removeFilter(filterIdx);
          unsubscribeFromFilterStats();
        };
      }

      case SubscriptionType.CPU_STATS:
        return this.messageHandler
          .getCPUStatsHandler()
          .subscribeToCPUStatsUpdates((data) => {
            callback({
              data: data as T,
              timestamp: Date.now(),
              subscriptionId,
            });
          });

      case SubscriptionType.LOGS:
        return this.messageHandler
          .getLogHandler()
          .subscribeToLogEntries((data) => {
            callback({
              data: data as T,
              timestamp: Date.now(),
              subscriptionId,
            });
          }, config.logLevel as GpacLogConfig);

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
