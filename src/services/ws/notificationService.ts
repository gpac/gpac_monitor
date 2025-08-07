import { toastService } from '@/shared/hooks/useToast';

export class WebSocketNotificationService {
  static onConnected(address: string): void {
    toastService.show({
      title: 'Connexion established',
      description: `Connected to ${address}`,
      variant: 'default',
    });
  }

  static onDisconnected(reason?: string, wasClean?: boolean): void {
    toastService.show({
      title: 'Connexion closed',
      description: reason || 'Connexion closed',
      variant: wasClean ? 'default' : 'destructive',
    });
  }

  static onError(): void {
    toastService.show({
      title: 'WebSocket error',
      description: 'An error occurred',
      variant: 'destructive',
    });
  }

}
