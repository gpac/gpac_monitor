import { ConnectionStatus } from '@/types/communication/shared';

/**
 * Get Tailwind CSS class for connection status indicator
 */
export const getConnectionStatusClass = (status?: ConnectionStatus): string => {
  switch (status) {
    case ConnectionStatus.CONNECTED:
      return 'bg-emerald-600';
    case ConnectionStatus.CONNECTING:
    case ConnectionStatus.RECONNECTING:
      return 'bg-amber-600';
    case ConnectionStatus.ERROR:
    case ConnectionStatus.DISCONNECTED:
      return 'bg-rose-600';
    default:
      return 'bg-gray-600';
  }
};
