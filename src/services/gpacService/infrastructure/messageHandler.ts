import { WebSocketBase } from '../../ws/WebSocketBase';
import { GpacNodeData } from '../../../types/domain/gpac/model';
import { GpacNotificationHandlers } from '../types';

export interface MessageHandlerCallbacks {
  onUpdateFilterData: (payload: { idx: number; data: any }) => void;
  onUpdateGraphData: (data: any) => void;
  onSetLoading: (loading: boolean) => void;
  onSetFilterDetails: (filter: any) => void;
  onUpdateSessionStats: (stats: any) => void;
}

export class MessageHandler {

  constructor(
    private currentFilterId: () => number | null,
    private hasSubscription: (idx: string) => boolean,
    private notificationHandlers: GpacNotificationHandlers,
    private callbacks: MessageHandlerCallbacks,
    private onMessage?: (message: any) => void,
  ) {}

  public handleJsonMessage(_: WebSocketBase, dataView: DataView): void {
    try {
      const text = new TextDecoder().decode(dataView.buffer);
      console.log('[MessageHandler] Processing JSON message:', text);
      const data = JSON.parse(text);
      this.processGpacMessage(data);
    } catch (error) {
      console.error('[MessageHandler] JSON message processing error:', error);
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
      console.error('[MessageHandler] Default message processing error:', error);
    }
  }

  private processGpacMessage(data: any): void {
    console.log('[MessageHandler] Processing GPAC message:', data);
    
    if (!data.message) {
      console.warn('[MessageHandler] Received message without type:', data);
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
        console.log('[MessageHandler] Unknown message type:', data.message);
    }

    this.onMessage?.(data);
  }

  private handleFiltersMessage(data: any): void {
    console.log('[MessageHandler] Handling filters message:', data);
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
    console.log('[MessageHandler] Session stats received:', data.stats);
    if (data.stats && Array.isArray(data.stats)) {
      this.callbacks.onUpdateSessionStats(data.stats);
    }
  }
  

  private handleCpuStatsMessage(data: any): void {
    console.log('[MessageHandler] CPU stats received:', data.stats);
  }

  private handleFilterStatsMessage(data: any): void {
    console.log('[MessageHandler] Filter stats received:', data);
    if (data.idx !== undefined) {
      const filterId = data.idx.toString();
      if (this.hasSubscription(filterId)) {
        this.callbacks.onUpdateFilterData({ idx: data.idx, data: data });
      }
    }
  }
}