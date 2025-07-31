import { WebSocketBase } from '../../../ws/WebSocketBase';
import { GpacNodeData } from '../../../../types/domain/gpac/model';
import { GpacNotificationHandlers } from '../../types';
import { generateID } from '@/utils/id';
import { SessionStatsHandler } from './sessionStatsHandler';
import { FilterStatsHandler } from './filterStatsHandlers';

export interface MessageHandlerCallbacks {
  onUpdateFilterData: (payload: { idx: number; data: any }) => void;
  onUpdateGraphData: (data: any) => void;
  onSetLoading: (loading: boolean) => void;
  onSetFilterDetails: (filter: any) => void;
  onUpdateSessionStats: (stats: any) => void;
}

export interface MessageHandlerDependencies {
  isConnected: () => boolean;
  send: (message: any) => Promise<void>;
}

export class BaseMessageHandler {
  private sessionStatsHandler: SessionStatsHandler;
  private filterStatsHandler: FilterStatsHandler;
  

  constructor(
    private currentFilterId: () => number | null,
    private hasSubscription: (idx: string) => boolean,
    private notificationHandlers: GpacNotificationHandlers,
    private callbacks: MessageHandlerCallbacks,
    private dependencies: MessageHandlerDependencies,
    private onMessage?: (message: any) => void,
    // @ts-ignore used by sessionStatsHandler
    private isLoaded?: () => boolean,
  ) {
    // Initialize specialized handlers
    this.sessionStatsHandler = new SessionStatsHandler(
      dependencies,
      isLoaded || (() => true),
    );
    this.filterStatsHandler = new FilterStatsHandler(
      dependencies,
    isLoaded || (() => true),
    );
  
  }

  // Expose handler methods
  public getSessionStatsHandler(): SessionStatsHandler {
    return this.sessionStatsHandler;
  }
  public getFilterStatsHandler(): FilterStatsHandler {
    return this.filterStatsHandler;
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

    if (data.filter.idx === this.currentFilterId()) {
      this.callbacks.onSetFilterDetails(data.filter);
    }
  }

  private handleSessionStatsMessage(data: any): void {
    if (data.stats && Array.isArray(data.stats)) {
      this.sessionStatsHandler.handleSessionStats(data.stats);
      this.callbacks.onUpdateSessionStats(data.stats);
    }
  }

  private handleCpuStatsMessage(_data: any): void {
    // CPU stats received
  }

  private handleFilterStatsMessage(data: any): void {
    if (data.idx !== undefined) {
      const filterId = data.idx.toString();
      if (this.hasSubscription(filterId)) {
        this.callbacks.onUpdateFilterData({ idx: data.idx, data: data });
      }
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
