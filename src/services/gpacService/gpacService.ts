import { WebSocketBase } from '../WebSocketBase';
import { store } from '../../store';
import { GpacNodeData } from '../../types/domain/gpac/model';
import {
  updateFilterData,
  setSelectedFilters,
} from '../../store/slices/multiFilterSlice';
import { updateRealTimeMetrics } from '../../store/slices/filter-monitoringSlice';
import {
  updateGraphData,
  setLoading,
  setError,
  setFilterDetails,
} from '../../store/slices/graphSlice';
import { GpacCommunicationAdapter } from '../communication/adapters/GpacCommunicationAdapter';
import {
  IGpacCommunication,
  GpacMessage,
} from '../../types/communication/IgpacCommunication';
import { throttle } from 'lodash';


export const NEW_WS_CONFIG = {
  address: 'ws://localhost:6363/rmt', // Updated port for new server
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
  maxDelay: 10000,
};

export class GpacService {
  private static instance: GpacService | null = null;
  private ws: WebSocketBase;
  private reconnectAttempts: number = 0;
  private readonly MAX_RECONNECT_ATTEMPTS: number = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting: boolean = false;
  private currentFilterId: number | null = null;
  private activeSubscriptions: Set<string> = new Set();
  private communicationAdapter: GpacCommunicationAdapter | null = null;
  
  // Notification properties
  private notifyFilterUpdate?: (filter: GpacNodeData) => void;
  private notifyError?: (error: Error) => void;
  private notifyConnectionStatus?: (connected: boolean) => void;

  public onMessage?: (message: any) => void;
  public onError?: (error: Error) => void;
  public onDisconnect?: () => void;

  private constructor(
    private readonly address: string = NEW_WS_CONFIG.address,
  ) {
    this.ws = new WebSocketBase();
    this.setupWebSocketHandlers();
  }

  public static getInstance(): GpacService {
    if (!GpacService.instance) {
      GpacService.instance = new GpacService();
    }
    return GpacService.instance;
  }

  public setNotificationHandlers({
    onError,
    onFilterUpdate,
    onConnectionStatus,
  }: {
    onError?: (error: Error) => void;
    onFilterUpdate?: (filter: GpacNodeData) => void;
    onConnectionStatus?: (connected: boolean) => void;
  }) {
    this.notifyError = onError;
    this.notifyFilterUpdate = onFilterUpdate;
    this.notifyConnectionStatus = onConnectionStatus;
  }

  public getCommunicationAdapter(): IGpacCommunication {
    if (!this.communicationAdapter) {
      this.communicationAdapter = new GpacCommunicationAdapter(this);
    }
    return this.communicationAdapter;
  }

  public async connect(): Promise<void> {
    if (this.isConnecting) return;
    console.log('[GpacService] Initiating connection to NEW GPAC server');
    this.isConnecting = true;
    store.dispatch(setLoading(true));
    
    try {
      await this.ws.connect(this.address);
      this.notifyConnectionStatus?.(true);
      console.log('[GpacService] Successfully connected to new GPAC server');
    } catch (error) {
      this.notifyError?.(error as Error);
      this.notifyConnectionStatus?.(false);
      this.handleDisconnect();
      throw error;
    }
  }

  public disconnect(): void {
    console.log('[GpacService] Initiating disconnect sequence');
    this.cleanup();
    this.ws.disconnect();
    store.dispatch(setSelectedFilters([]));
    store.dispatch(setFilterDetails(null));
  }

  // NEW: Updated message sending for new server format
  public sendMessage(message: GpacMessage): void {
    if (!this.ws.isConnected()) {
      throw new Error('[GpacService] WebSocket not connected');
    }
    try {
      // NEW FORMAT: Direct JSON without CONI prefix, just json: prefix
      const formattedMessage = { 
        message: message.type, 
        ...message 
      };
      const jsonString = JSON.stringify(formattedMessage);
      console.log('[GpacService] Sending message to NEW server:', jsonString);
      
      // The WebSocketBase will add the "json:" prefix automatically
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

  // NEW: Subscribe with session subscription support
  public subscribeToFilter(idx: string): void {
    if (this.activeSubscriptions.has(idx)) return;
    this.activeSubscriptions.add(idx);
    
    // NEW: Use filter subscription for detailed monitoring
    this.sendMessage({ 
      type: 'subscribe_filter', 
      idx: parseInt(idx, 10),
      interval: 1000 // Update every second
    });
    console.log(`[GpacService] Subscribed to filter ${idx} with new API`);
  }

  public unsubscribeFromFilter(idx: string): void {
    if (!this.activeSubscriptions.has(idx)) return;
    this.activeSubscriptions.delete(idx);
    
    // NEW: Use unsubscribe API
    this.sendMessage({ 
      type: 'unsubscribe_filter', 
      idx: parseInt(idx, 10) 
    });
    console.log(`[GpacService] Unsubscribed from filter ${idx}`);
  }

  // NEW: Subscribe to session statistics
  public subscribeToSessionStats(): void {
    this.sendMessage({
      type: 'subscribe_session',
      interval: 1000,
      fields: ['status', 'bytes_done', 'pck_sent', 'pck_done', 'time']
    });
    console.log('[GpacService] Subscribed to session statistics');
  }

  // NEW: Subscribe to CPU statistics  
  public subscribeToCpuStats(): void {
    this.sendMessage({
      type: 'subscribe_cpu_stats',
      interval: 1000
    });
    console.log('[GpacService] Subscribed to CPU statistics');
  }

  private readonly throttledUpdateRealTimeMetrics = throttle(
    (payload: any) => {
      if (payload.bytesProcessed > 0) {
        store.dispatch(updateRealTimeMetrics(payload));
      }
    },
    1000,
    { leading: true, trailing: true },
  );

  private setupWebSocketHandlers(): void {
    this.ws.addConnectHandler(() => {
      console.log('[GpacService] Connection established with NEW server');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      store.dispatch(setError(null));
      
      // NEW: Request all filters and subscribe to updates
      this.sendMessage({ type: 'get_all_filters' });
      
      // NEW: Subscribe to session and CPU stats for enhanced monitoring
      this.subscribeToSessionStats();
      this.subscribeToCpuStats();
    });

    // NEW: Handle json: prefixed messages from new server
    this.ws.addJsonMessageHandler(this.handleJsonMessage.bind(this));
    
    // Keep legacy handlers for compatibility
    this.ws.addMessageHandler('CONI', this.handleConiMessage.bind(this));
    this.ws.addDefaultMessageHandler(this.handleDefaultMessage.bind(this));

    this.ws.addDisconnectHandler(() => {
      console.log('[GpacService] Disconnected from server');
      this.handleDisconnect();
    });
  }

  private handleJsonMessage(_: WebSocketBase, dataView: DataView): void {
    try {
      const text = new TextDecoder().decode(dataView.buffer);
      console.log('[GpacService] Processing JSON message from NEW server:', text);
      const data = JSON.parse(text);
      this.processGpacMessage(data);
    } catch (error) {
      console.error('[GpacService] JSON message processing error:', error);
    }
  }

  private handleConiMessage(_: WebSocketBase, dataView: DataView): void {
    try {
      // Legacy handler - kept for compatibility
      const text = new TextDecoder().decode(dataView.buffer.slice(4));
      if (text.startsWith('json:')) {
        const jsonText = text.slice(5);
        const data = JSON.parse(jsonText);
        this.processGpacMessage(data);
      }
    } catch (error) {
      console.error('[GpacService] CONI message processing error:', error);
    }
  }

  private handleDefaultMessage(_: WebSocketBase, dataView: DataView): void {
    try {
      const text = new TextDecoder().decode(dataView.buffer);
      if (text.startsWith('{')) {
        const data = JSON.parse(text);
        this.processGpacMessage(data);
      }
    } catch (error) {
      console.error('[GpacService] Default message processing error:', error);
    }
  }

  // NEW: Enhanced message processing for new server types
  private processGpacMessage(data: any): void {
    console.log('[GpacService] Processing GPAC message:', data);
    
    if (!data.message) {
      console.warn('[GpacService] Received message without type:', data);
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
      // NEW: Handle session statistics
      case 'session_stats':
        this.handleSessionStatsMessage(data);
        break;
      // NEW: Handle CPU statistics
      case 'cpu_stats':
        this.handleCpuStatsMessage(data);
        break;
      // NEW: Handle filter statistics
      case 'filter_stats':
        this.handleFilterStatsMessage(data);
        break;
      default:
        console.log('[GpacService] Unknown message type:', data.message);
    }

    // Call external message handler if set
    this.onMessage?.(data);
  }

  public handleFiltersMessage(data: any): void {
    console.log('[GpacService] Handling filters message:', data);
    store.dispatch(setLoading(false));
    store.dispatch(updateGraphData(data.filters));
    
    if (data.filters) {
      data.filters.forEach((filter: GpacNodeData) => {
        this.notifyFilterUpdate?.(filter);
      });
    }
  }

  public handleUpdateMessage(data: any): void {
    if (Array.isArray(data.filters)) {
      store.dispatch(updateGraphData(data.filters));
    }
  }

  public handleDetailsMessage(data: any): void {
    if (!data.filter) return;
    const filterId = data.filter.idx.toString();
    
    if (data.filter.idx === this.currentFilterId) {
      store.dispatch(setFilterDetails(data.filter));
    }
    
    if (this.activeSubscriptions.has(filterId)) {
      store.dispatch(updateFilterData({ id: filterId, data: data.filter }));
      this.throttledUpdateRealTimeMetrics({
        filterId,
        bytes_done: data.filter.bytes_done,
        buffer: data.filter.buffer,
        buffer_total: data.filter.buffer_total,
      });
    }
  }

  // NEW: Handle session statistics
  private handleSessionStatsMessage(data: any): void {
    console.log('[GpacService] Session stats received:', data.stats);
    // TODO: Implement session stats handling in Redux store
  }

  // NEW: Handle CPU statistics
  private handleCpuStatsMessage(data: any): void {
    console.log('[GpacService] CPU stats received:', data.stats);
    // TODO: Implement CPU stats handling in Redux store
  }

  // NEW: Handle filter-specific statistics
  private handleFilterStatsMessage(data: any): void {
    console.log('[GpacService] Filter stats received:', data);
    // Handle real-time filter updates
    if (data.idx !== undefined) {
      const filterId = data.idx.toString();
      if (this.activeSubscriptions.has(filterId)) {
        store.dispatch(updateFilterData({ id: filterId, data: data }));
      }
    }
  }

  private cleanup(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.isConnecting = false;
    this.currentFilterId = null;
    this.reconnectAttempts = 0;
    this.activeSubscriptions.clear();
  }

  private handleDisconnect(): void {
    this.onDisconnect?.();
    if (
      !this.isConnecting &&
      this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS
    ) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++;
        console.log(`[GpacService] Reconnection attempt ${this.reconnectAttempts}`);
        this.connect().catch(console.error);
      }, delay);
    } else {
      store.dispatch(setError('Failed to connect to GPAC server'));
    }
  }
}

export const gpacService = GpacService.getInstance();