import { WebSocketBase } from '../../../ws/WebSocketBase';
import { GpacNodeData } from '../../../../types/domain/gpac/model';
import { GpacNotificationHandlers } from '../../types';
import { generateID } from '@/utils/core';
import { SessionStatsHandler } from './sessionStatsHandler';
import { FilterStatsHandler } from './filterStatsHandler';

import { WSMessageBatcher } from '../../../utils/WSMessageBatcher';

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
  private messageBatcher: WSMessageBatcher;

  constructor(
    /*   private currentFilterId: () => number | null, */
    _hasSubscription: (idx: string) => boolean,
    private notificationHandlers: GpacNotificationHandlers,
    private callbacks: MessageHandlerCallbacks,
    private dependencies: MessageHandlerDependencies,
    private onMessage?: (message: any) => void,
    // @ts-expect-error used by sessionStatsHandlerfv
    private isLoaded?: () => boolean,
  ) {
    // Initialize message batcher (RAF-based batching for high-frequency messages)
    this.messageBatcher = new WSMessageBatcher();

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

    // Register batch handlers for high-frequency messages
    this.registerBatchHandlers();
  }

  /**
   * Register handlers for batched message processing
   * High-frequency messages (logs, stats) are batched and processed once per frame
   */
  private registerBatchHandlers(): void {
    // Log batch handler
    this.messageBatcher.registerHandler('log_batch', (messages: any[]) => {
      // Aggregate all logs from all messages in this frame
      const allLogs = messages.flatMap((msg) => msg.logs || []);
      if (allLogs.length > 0) {
        this.logHandler.handleLogBatch(allLogs);
      }
    });

    // Session stats handler
    this.messageBatcher.registerHandler('session_stats', (messages: any[]) => {
      // Use only the last stats message in the frame (most recent)
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.stats) {
        this.sessionStatsHandler.handleSessionStats(lastMessage.stats);
      }
    });

    // CPU stats handler
    this.messageBatcher.registerHandler('cpu_stats', (messages: any[]) => {
      // Use only the last CPU stats in the frame
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.stats) {
        this.cpuStatsHandler.handleCPUStats(lastMessage.stats);
      }
    });

    // Filter stats handler
    this.messageBatcher.registerHandler('filter_stats', (messages: any[]) => {
      // Group by filter idx and process each
      const byFilterIdx = new Map<number, any>();
      for (const msg of messages) {
        if (msg.idx !== undefined) {
          byFilterIdx.set(msg.idx, msg); // Keep last message per filter
        }
      }
      for (const [_, filterData] of byFilterIdx) {
        this.filterStatsHandler.handleFilterStatsUpdate(filterData);
      }
    });
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
      case 'update_arg_response':
        this.handleUpdateArgResponseMessage(data);
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
      // Queue message for RAF batch processing
      this.messageBatcher.add('session_stats', data);
    }
  }

  private handleCpuStatsMessage(data: any): void {
    // Queue message for RAF batch processing
    this.messageBatcher.add('cpu_stats', data);
  }

  private handleFilterStatsMessage(data: any): void {
    if (data.idx !== undefined) {
      // Queue message for RAF batch processing
      this.messageBatcher.add('filter_stats', data);
    } else {
      // filter_stats message missing idx
    }
  }

  private handleLogBatchMessage(data: LogBatchResponse): void {
    if (data.logs && Array.isArray(data.logs)) {
      // Queue logs for RAF batch processing (CRITICAL for performance)
      this.messageBatcher.add('log_batch', data);
    } else {
      console.log(
        '[BaseMessageHandler] No logs in data or data.logs not an array:',
        data,
      );
    }
  }

  private handleLogHistoryMessage(data: LogHistoryResponse): void {
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

  private handleUpdateArgResponseMessage(data: any): void {
    this.filterArgsHandler.handleUpdateArgResponse(data);
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
