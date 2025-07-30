import { IGpacMessageHandler } from './IGpacMessageHandler';
import { GpacMessage, ConnectionStatus } from './shared';

export type { GpacMessage } from './shared';
export { ConnectionStatus } from './shared';

/**
 * Configuration interface for GPAC communication channels.
 * Provides necessary parameters for connection management and retry policies.
 */
export interface IGpacCommunicationConfig {
  /** WebSocket endpoint address */
  address: string;

  /** Maximum number of reconnection attempts before failing */
  maxReconnectAttempts: number;

  /** Base delay (in ms) between reconnection attempts */
  reconnectDelay: number;

  /** Optional initial connection delay */
  initialDelay?: number;

  /** Maximum delay cap for exponential backoff */
  maxDelay?: number;

  /** Optional timeout for connection attempts */
  connectionTimeout?: number;
}

/**
 * Core interface for GPAC communication implementations.
 * Provides contract for WebSocket and future communication channels.
 */
export interface IGpacCommunication {
  /**
   * Initiates connection with GPAC service.
   * @param config - Connection configuration parameters
   * @throws {GpacConnectionError} On connection failure
   */
  connect(config: IGpacCommunicationConfig): Promise<void>;

  /**
   * Gracefully terminates connection.
   * Cleans up resources and event listeners.
   */
  disconnect(): void;

  /**
   * Sends message to GPAC service.
   * @param message - Formatted GPAC message
   * @throws {GpacMessageError} On send failure
   */
  send(message: GpacMessage): void;

  /**
   * Registers message handler for specific message types.
   * @param handler - Message handler implementation
   * @returns Cleanup function for handler removal
   */
  registerHandler(handler: IGpacMessageHandler): () => void;

  /**
   * Removes specific message handler.
   * @param handler - Previously registered handler
   */
  unregisterHandler(handler: IGpacMessageHandler): void;

  /**
   * Queries current connection status.
   * @returns Current connection state
   */
  getStatus(): ConnectionStatus;

  /**
   * Verifies active connection state.
   * @returns Boolean indicating connection status
   */
  isConnected(): boolean;
}
