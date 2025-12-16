import { WebSocketBase } from '../../ws/WebSocketBase';
import { store } from '@/shared/store';
import { setLoading, setError } from '@/shared/store/slices/graphSlice';
import { GPAC_CONSTANTS } from '../config';
import { GpacNotificationHandlers } from '../types';

export class ConnectionManager {
  private reconnectAttempts: number = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting: boolean = false;
  private isManualDisconnect: boolean = false;
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
    this.isManualDisconnect = false;
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
    this.isManualDisconnect = true; // Mark as manual disconnect
    this.cleanup();
    this.ws.disconnect();
  }

  public isConnected(): boolean {
    return this.ws.isConnected();
  }

  public handleDisconnect(): void {
    // Don't reconnect if it was a manual disconnect
    if (this.isManualDisconnect) {
      console.log(
        '[ConnectionManager] Manual disconnect - stopping reconnection attempts',
      );
      return;
    }

    // Check if max attempts reached before scheduling reconnect
    if (this.reconnectAttempts >= GPAC_CONSTANTS.MAX_RECONNECT_ATTEMPTS) {
      console.log(
        '[ConnectionManager] Max reconnection attempts reached - stopping',
      );
      this.isManualDisconnect = true; // Prevent further reconnection attempts
      store.dispatch(setError('Failed to connect to GPAC server'));
      return;
    }

    // Only reconnect if not already connecting and not connected
    if (!this.isConnecting && !this.ws.isConnected()) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      console.log(
        `[ConnectionManager] Scheduling reconnection attempt ${this.reconnectAttempts + 1}/${GPAC_CONSTANTS.MAX_RECONNECT_ATTEMPTS} in ${delay}ms`,
      );

      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }

      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++;
        this.connect().catch((error) => {
          console.error(
            `[ConnectionManager] Reconnection attempt ${this.reconnectAttempts} failed:`,
            error,
          );
        });
      }, delay);
    }
  }

  private onConnectionSuccess(): void {
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    store.dispatch(setError(null));
  }

  /** Stop reconnection attempts manually (e.g., when GPAC process is closed) */
  public stopReconnection(): void {
    this.isManualDisconnect = true;
    this.cleanup();
  }

  private cleanup(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }
}
