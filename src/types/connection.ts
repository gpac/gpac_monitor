import { ConnectionStatus } from './communication/shared';

/**
 * Type of GPAC connection
 */
export type GpacConnectionType = 'local' | 'remote';

/**
 * Configuration for a GPAC connection
 */
export interface GpacConnectionConfig {
  /** Unique identifier */
  id: string;

  /** Display name */
  name: string;

  /** WebSocket address */
  address: string;

  /** Connection type (local/remote) */
  type: GpacConnectionType;

  /** Current connection status */
  status?: ConnectionStatus;

  /** Extensibility for future metadata */
  meta?: Record<string, unknown>;
}
