import { WebSocketBase } from '../WebSocketBase';
import { store } from '../../store';
import { GpacNodeData } from '../../types/domain/gpac/model';
import { updateFilterData } from '../../store/slices/multiFilterSlice';
import { updateRealTimeMetrics } from '../../store/slices/filter-monitoringSlice';
import { updateGraphData, setLoading, setFilterDetails } from '../../store/slices/graphSlice';
import { throttle } from 'lodash';
import { GPAC_CONSTANTS } from './config';
import { GpacNotificationHandlers } from './types';

export class MessageHandler {
  private readonly throttledUpdateRealTimeMetrics = throttle(
    (payload: any) => {
      if (payload.bytesProcessed > 0) {
        store.dispatch(updateRealTimeMetrics(payload));
      }
    },
    GPAC_CONSTANTS.THROTTLE_DELAY,
    { leading: true, trailing: true },
  );

  constructor(
    private currentFilterId: () => number | null,
    private hasSubscription: (idx: string) => boolean,
    private notificationHandlers: GpacNotificationHandlers,
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

  public handleConiMessage(_: WebSocketBase, dataView: DataView): void {
    try {
      const text = new TextDecoder().decode(dataView.buffer.slice(4));
      if (text.startsWith('json:')) {
        const jsonText = text.slice(5);
        const data = JSON.parse(jsonText);
        this.processGpacMessage(data);
      }
    } catch (error) {
      console.error('[MessageHandler] CONI message processing error:', error);
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
    store.dispatch(setLoading(false));
    store.dispatch(updateGraphData(data.filters));
    
    if (data.filters) {
      data.filters.forEach((filter: GpacNodeData) => {
        this.notificationHandlers.onFilterUpdate?.(filter);
      });
    }
  }

  private handleUpdateMessage(data: any): void {
    if (Array.isArray(data.filters)) {
      store.dispatch(updateGraphData(data.filters));
    }
  }

  private handleDetailsMessage(data: any): void {
    if (!data.filter) return;
    const filterId = data.filter.idx.toString();
    
    if (data.filter.idx === this.currentFilterId()) {
      store.dispatch(setFilterDetails(data.filter));
    }
    
    if (this.hasSubscription(filterId)) {
      store.dispatch(updateFilterData({ id: filterId, data: data.filter }));
      this.throttledUpdateRealTimeMetrics({
        filterId,
        bytes_done: data.filter.bytes_done,
        buffer: data.filter.buffer,
        buffer_total: data.filter.buffer_total,
      });
    }
  }

  private handleSessionStatsMessage(data: any): void {
    console.log('[MessageHandler] Session stats received:', data.stats);
    if (data.stats && Array.isArray(data.stats)) {
      import('../../store').then(({ store }) => {
        store.dispatch(require('../../store/slices/sessionStatsSlice').updateSessionStats(data.stats));
      });
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
        store.dispatch(updateFilterData({ id: filterId, data: data }));
      }
    }
  }
}