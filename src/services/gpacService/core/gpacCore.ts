import { IGpacCommunication,ConnectionStatus } from '../../../types/communication/IgpacCommunication';
import { IGpacMessageHandler } from '../../../types/communication/IGpacMessageHandler';

export class GpacCoreService implements IGpacCommunication {
  private currentFilterId: number | null = null;
  private messageHandlers: Set<IGpacMessageHandler> = new Set();
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;

  public setCurrentFilterId(id: number | null): void {
    this.currentFilterId = id;
  }

  public getCurrentFilterId(): number | null {
    return this.currentFilterId;
  }

  public connect(): Promise<void> {
    throw new Error('Connect method should be implemented by the orchestrating service');
  }

  public disconnect(): void {
    this.status = ConnectionStatus.DISCONNECTED;
    this.messageHandlers.clear();
  }

  public send(): void {
    throw new Error('Send method should be implemented by the orchestrating service');
  }

  public registerHandler(handler: IGpacMessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.unregisterHandler(handler);
  }

  public unregisterHandler(handler: IGpacMessageHandler): void {
    this.messageHandlers.delete(handler);
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public isConnected(): boolean {
    return this.status === ConnectionStatus.CONNECTED;
  }

  protected setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.messageHandlers.forEach(handler => {
      handler.onStatusChange?.(status);
    });
  }

  public notifyHandlers(message: any): void {
    this.messageHandlers.forEach(handler => {
      try {
        handler.onMessage?.(message);
      } catch (error) {
        console.error('[GpacCoreService] Handler error:', error);
        handler.onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }
}