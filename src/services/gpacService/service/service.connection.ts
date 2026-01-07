import { GpacServiceState } from './service.types';
import { ConnectionStatus } from '../../../types/communication/IgpacCommunication';

export const connectionMethods = {
  /**
   * Connect to GPAC server at specified address
   */
  async connect(state: GpacServiceState, address: string): Promise<void> {
    return state.connectionManager.connect(address);
  },

  /**
   * Check if WebSocket is currently connected
   */
  isConnected(state: GpacServiceState): boolean {
    return state.connectionManager.isConnected();
  },

  /**
   * Check if service is loaded and connected
   */
  isLoaded(state: GpacServiceState): boolean {
    return state.isLoaded && state.connectionManager.isConnected();
  },

  /**
   * Wait for service to be ready
   * Returns cached promise if already loading
   */
  async ready(
    state: GpacServiceState,
    address: string,
    loadFn: (address: string) => Promise<boolean>,
  ): Promise<void> {
    if (!state.readyPromise) {
      state.readyPromise = loadFn(address).then(() => {});
    }
    return state.readyPromise;
  },

  /**
   * Get current connection status
   */
  getStatus(state: GpacServiceState): ConnectionStatus {
    return state.coreService.getStatus();
  },
};
