import { ConnectionStatus } from './communication/shared';

export type GpacConnectionType = 'local' | 'remote';

export interface GpacConnectionConfig {
  id: string;
  name: string;
  address: string;
  type: GpacConnectionType;
  status?: ConnectionStatus;

  /** Extensibility for future metadata */
  meta?: Record<string, unknown>;
}
