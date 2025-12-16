import { WebSocketBase } from '../../ws/WebSocketBase';
import { store } from '@/shared/store';
import { setLoading, setError } from '@/shared/store/slices/graphSlice';
import { GpacNotificationHandlers } from '../types';

export class ConnectionManager {
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting: boolean = false;
  private notificationHandlers: GpacNotificationHandlers = {};
  private address: string | null = null;

  constructor(private ws: WebSocketBase) {}

  public setNotificationHandlers(handlers: GpacNotificationHandlers): void {
    this.notificationHandlers = handlers;
  }

  public setAddress(address: string): void {
    this.address = address;
  }

  public async connect(address?: string): Promise<void> {
    const targetAddress = address || this.address;

    if (!targetAddress) {
      throw new Error('[ConnectionManager] No address provided');
    }

    if (this.isConnecting) {
      return;
    }

    if (this.ws.isConnected()) {
      return;
    }

    this.address = targetAddress;
    this.isConnecting = true;
    store.dispatch(setLoading(true));

    try {
      await this.ws.connect(targetAddress);
      this.notificationHandlers.onConnectionStatus?.(true);
      this.onConnectionSuccess();
    } catch (error) {
      this.isConnecting = false;
      store.dispatch(setLoading(false));
      this.notificationHandlers.onError?.(error as Error);
      this.notificationHandlers.onConnectionStatus?.(false);
      throw error;
    }
  }

  public disconnect(): void {
    this.cleanup();
    this.ws.disconnect();
  }

  public isConnected(): boolean {
    return this.ws.isConnected();
  }

  public handleDisconnect(): void {
    console.log(
      '[ConnectionManager] Connection lost - no automatic reconnection',
    );
    this.cleanup();
    store.dispatch(setError('Connection to GPAC server lost'));
  }

  private onConnectionSuccess(): void {
    this.isConnecting = false;
    store.dispatch(setError(null));
  }

  /** Stop reconnection attempts manually (e.g., when GPAC process is closed) */
  public stopReconnection(): void {
    this.cleanup();
  }

  private cleanup(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.isConnecting = false;
  }
}
