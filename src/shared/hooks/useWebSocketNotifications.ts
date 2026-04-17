import { useEffect } from 'react';
import { gpacService } from '@/services/gpacService';
import type { ToasterToast } from './useToast';

interface UseWebSocketNotificationsProps {
  toast: (props: Omit<ToasterToast, 'id'>) => void;
}

export const useWebSocketNotifications = ({
  toast,
}: UseWebSocketNotificationsProps) => {
  useEffect(() => {
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
  }, [toast]);
};
