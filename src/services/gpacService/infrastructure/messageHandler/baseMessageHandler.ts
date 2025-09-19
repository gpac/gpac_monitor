import { WebSocketBase } from '../../../ws/WebSocketBase';
import { GpacNodeData } from '../../../../types/domain/gpac/model';
import { GpacNotificationHandlers } from '../../types';
import { generateID } from '@/utils/id';
import { SessionStatsHandler } from './sessionStatsHandler';
import { FilterStatsHandler } from './filterStatsHandler';
import { MessageThrottler } from '../../../utils/MessageThrottler';

import { MessageHandlerCallbacks, MessageHandlerDependencies } from './types';
import { CPUStatsHandler } from './cpuStatsHandler';
import { FilterArgsHandler } from './filterArgsHandler';
import { LogHandler } from './logHandler';
import {
  LogBatchResponse,
  LogHistoryResponse,
  LogStatusResponse,
  LogConfigChangedResponse,
} from '@/services/ws/types';

export type { MessageHandlerCallbacks, MessageHandlerDependencies };

export class BaseMessageHandler {
  private sessionStatsHandler: SessionStatsHandler;
  private filterStatsHandler: FilterStatsHandler;
  private cpuStatsHandler: CPUStatsHandler;
  private filterArgsHandler: FilterArgsHandler;
  private logHandler: LogHandler;
  private messageThrottler: MessageThrottler;

  constructor(
    /*   private currentFilterId: () => number | null, */
    _hasSubscription: (idx: string) => boolean,
    private notificationHandlers: GpacNotificationHandlers,
    private callbacks: MessageHandlerCallbacks,
    private dependencies: MessageHandlerDependencies,
    private onMessage?: (message: any) => void,
    // @ts-expect-error used by sessionStatsHandler
    private isLoaded?: () => boolean,
  ) {
    // Initialize message throttler for performance
    this.messageThrottler = new MessageThrottler();

    // Initialize specialized handlers
    this.sessionStatsHandler = new SessionStatsHandler(
      dependencies,
      isLoaded || (() => true),
    );
    this.filterStatsHandler = new FilterStatsHandler(
      dependencies,
      isLoaded || (() => true),
    );
    this.cpuStatsHandler = new CPUStatsHandler(
      dependencies,
      isLoaded || (() => true),
    );
    this.filterArgsHandler = new FilterArgsHandler(
      dependencies,
      isLoaded || (() => true),
    );
    this.logHandler = new LogHandler(
      dependencies,
      isLoaded || (() => true),
      callbacks,
    );
  }

  // Expose handler methods
  public getSessionStatsHandler(): SessionStatsHandler {
    return this.sessionStatsHandler;
  }
  public getFilterStatsHandler(): FilterStatsHandler {
    return this.filterStatsHandler;
  }
  public getCPUStatsHandler(): CPUStatsHandler {
    return this.cpuStatsHandler;
  }
  public getFilterArgsHandler(): FilterArgsHandler {
    return this.filterArgsHandler;
  }
  public getLogHandler(): LogHandler {
    return this.logHandler;
  }

  public handleJsonMessage(_: WebSocketBase, dataView: DataView): void {
    try {
      const text = new TextDecoder().decode(dataView.buffer);
      const data = JSON.parse(text);
      this.processGpacMessage(data);
    } catch (error) {
      // Error handling
    }
  }

  public handleDefaultMessage(_: WebSocketBase, dataView: DataView): void {
    try {
      const text = new TextDecoder().decode(dataView.buffer);
      if (text.startsWith('{')) {
        const data = JSON.parse(text);
        this.processGpacMessage(data);
      }
    } catch (error) {
      // Error handling
    }
  }

  private processGpacMessage(data: any): void {
    if (!data.message) {
      return;
    }

    console.log('[BaseMessageHandler] Processing message type:', data.message);

    switch (data.message) {
      case 'filters':
        this.handleFiltersMessage(data);
        break;
      case 'update':
        this.handleUpdateMessage(data);
        break;
      case 'details':
        this.handleDetailsMessage(data);
        break;
      case 'session_stats':
        this.handleSessionStatsMessage(data);
        break;
      case 'cpu_stats':
        this.handleCpuStatsMessage(data);
        break;
      case 'filter_stats':
        this.handleFilterStatsMessage(data);
        break;
      case 'log_batch':
        this.handleLogBatchMessage(data);
        break;
      case 'log_history':
        this.handleLogHistoryMessage(data);
        break;
      case 'log_status':
        this.handleLogStatusMessage(data);
        break;
      case 'log_config_changed':
        this.handleLogConfigChangedMessage(data);
        break;
      default:
      // Unknown message type
    }

    this.onMessage?.(data);
  }

  private handleFiltersMessage(data: any): void {
    this.callbacks.onSetLoading(false);
    this.callbacks.onUpdateGraphData(data.filters);

    if (data.filters) {
      data.filters.forEach((filter: GpacNodeData) => {
        this.notificationHandlers.onFilterUpdate?.(filter);
      });
    }
  }

  private handleUpdateMessage(data: any): void {
    if (Array.isArray(data.filters)) {
      this.callbacks.onUpdateGraphData(data.filters);
    }
  }

  private handleDetailsMessage(data: any): void {
    if (!data.filter) return;
    this.filterArgsHandler.handleFilterArgs(data);
  }

  private handleSessionStatsMessage(data: any): void {
    if (data.stats && Array.isArray(data.stats)) {
      this.messageThrottler.throttle(
        'session_stats',
        (stats) => this.sessionStatsHandler.handleSessionStats(stats),
        1000,
        data.stats,
      );
    }
  }

  private handleCpuStatsMessage(data: any): void {
    this.messageThrottler.throttle(
      'cpu_stats',
      (stats) => this.cpuStatsHandler.handleCPUStats(stats),
      500,
      data.stats,
    );
  }

  private handleFilterStatsMessage(data: any): void {
    if (data.idx !== undefined) {
      this.messageThrottler.throttle(
        `filter_stats_${data.idx}`,
        (filterData) =>
          this.filterStatsHandler.handleFilterStatsUpdate(filterData),
        1000,
        data,
      );
    } else {
      // filter_stats message missing idx
    }
  }

  private handleLogBatchMessage(data: LogBatchResponse): void {
    console.log(
      '[BaseMessageHandler] handleLogBatchMessage received:',
      data?.logs?.length || 0,
      'logs',
    );
    console.log('[BaseMessageHandler] handleLogBatchMessage data:', data);
    if (data.logs && Array.isArray(data.logs)) {
      console.log(
        '[BaseMessageHandler] Calling logHandler.handleLogBatch with',
        data.logs.length,
        'logs',
      );
      this.logHandler.handleLogBatch(data.logs);
    } else {
      console.log(
        '[BaseMessageHandler] No logs in data or data.logs not an array:',
        data,
      );
    }
  }

  private handleLogHistoryMessage(data: LogHistoryResponse): void {
    console.log(
      '[BaseMessageHandler] handleLogHistoryMessage received:',
      data?.logs?.length || 0,
      'logs',
    );
    if (data.logs && Array.isArray(data.logs)) {
      this.logHandler.handleLogHistory(data.logs);
    }
  }

  private handleLogStatusMessage(data: LogStatusResponse): void {
    if (data.status) {
      this.logHandler.handleLogStatus(data.status);
    }
  }

  private handleLogConfigChangedMessage(data: LogConfigChangedResponse): void {
    if (data.logLevel) {
      this.logHandler.handleLogConfigChanged(data.logLevel);
    }
  }

  /**
   * Checks if the WebSocket client is connected
   *
   * @returns true if connected, throws an error otherwise
   */
  protected ensureConnected(): boolean {
    if (!this.dependencies.isConnected()) {
      const error = new Error('WebSocket client is not connected');
      throw error;
    }
    return true;
  }

  /**
   * Generate a unique ID for messages
   */
  protected static generateMessageId(): string {
    return generateID();
  }
}
