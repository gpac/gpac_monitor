import { useEffect } from 'react';
import { gpacService } from '@/services/gpacService';
import type { ToasterToast } from '../ui/useToast';

interface UseWebSocketNotificationsProps {
  toast: (props: Omit<ToasterToast, 'id'>) => void;
  disabled?: boolean;
}

export const useWebSocketNotifications = ({
  toast,
  disabled = false,
}: UseWebSocketNotificationsProps) => {
  useEffect(() => {
    if (disabled) return;
    gpacService.setNotificationHandlers({
      onConnectionStatus: (connected: boolean) => {
        toast({
          title: connected ? 'Connection established' : 'Connection closed',
          variant: connected ? 'default' : 'destructive',
        });
      },
      onError: () => {
        toast({
          title: 'WebSocket error',
          description: 'An error occurred',
          variant: 'destructive',
        });
      },
      onBackendNotification: (title: string, description: string) => {
        toast({ title, description });
      },
    });

    return () => {
      gpacService.setNotificationHandlers({});
    };
  }, [toast, disabled]);
};
