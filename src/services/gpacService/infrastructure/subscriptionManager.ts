import { GpacMessage } from '../../../types/communication/IgpacCommunication';
import { GPAC_CONSTANTS } from '../config';

export class SubscriptionManager {
  private activeSubscriptions: Set<string> = new Set();

  constructor(private sendMessage: (message: GpacMessage) => void) {}

  public subscribeToFilter(idx: string): void {
    if (this.activeSubscriptions.has(idx)) return;
    this.activeSubscriptions.add(idx);
    
    this.sendMessage({ 
      type: 'subscribe_filter', 
      idx: parseInt(idx, 10),
      interval: GPAC_CONSTANTS.SUBSCRIPTION_INTERVAL
    });
    console.log(`[SubscriptionManager] Subscribed to filter ${idx}`);
  }

  public unsubscribeFromFilter(idx: string): void {
    if (!this.activeSubscriptions.has(idx)) return;
    this.activeSubscriptions.delete(idx);
    
    this.sendMessage({ 
      type: 'unsubscribe_filter', 
      idx: parseInt(idx, 10) 
    });
    console.log(`[SubscriptionManager] Unsubscribed from filter ${idx}`);
  }

  public subscribeToSessionStats(): void {
    this.sendMessage({
      type: 'subscribe_session',
      interval: GPAC_CONSTANTS.SUBSCRIPTION_INTERVAL,
      fields: GPAC_CONSTANTS.SESSION_FIELDS, // Use predefined session fields
   
    });
    console.log('[SubscriptionManager] Subscribed to session statistics');
  }

  public subscribeToCpuStats(): void {
    this.sendMessage({
      type: 'subscribe_cpu_stats',
      interval: GPAC_CONSTANTS.SUBSCRIPTION_INTERVAL
    });
    console.log('[SubscriptionManager] Subscribed to CPU statistics');
  }

  public hasSubscription(idx: string): boolean {
    return this.activeSubscriptions.has(idx);
  }

  public clearSubscriptions(): void {
    this.activeSubscriptions.clear();
  }

  public getActiveSubscriptions(): Set<string> {
    return new Set(this.activeSubscriptions);
  }
}