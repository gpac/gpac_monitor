/**
 * Core message types supported by GPAC communication protocol.
 * Extensible for future message types.
 */
export type GpacMessageType =
  | 'get_all_filters'
  | 'filter_args_details'
  | 'stop_details'
  | 'update_arg'
  | 'get_png'
  | 'filters'
  | 'update'
  | 'details'
  | 'subscribe_filter'
  | 'unsubscribe_filter'
  | 'subscribe_session'
  | 'unsubscribe_session'
  | 'subscribe_cpu_stats'
  | 'unsubscribe_cpu_stats'
  | 'subscribe_logs'
  | 'unsubscribe_logs'
  | 'update_log_level'
  | 'get_log_status'
  | 'log_entry'
  | 'log_history'
  | 'log_status'
  | 'log_config_changed';

/**
 * Base message structure for GPAC communication.
 * All specific message types extend this interface.
 */
export interface GpacMessageBase {
  readonly type: GpacMessageType;
  readonly timestamp?: number;
}

/**
 * Union type of all possible GPAC messages.
 * Provides type safety for message handling.
 */
export interface GpacMessage {
  type: GpacMessageType;
  message?: GpacMessageType;
  [key: string]: any;
}

/**
 * Connection status enumeration for precise state management.
 */
export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR',
}

/**
 * Event types for connection lifecycle management.
 */
export enum ConnectionEventType {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  MESSAGE = 'message',
  ERROR = 'error',
  STATUS_CHANGE = 'status_change',
}

/**
 * Custom error class for GPAC communication failures.
 */
export class GpacCommunicationError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = 'GpacCommunicationError';
  }
}
