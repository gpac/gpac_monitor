import type { MonitoredFilterStats } from '@/types/domain/gpac';
import { WSMessageType } from '@/services/ws/types';
import { UpdatableSubscribable } from '@/services/utils/UpdatableSubcribable';
import { generateID } from '@/utils/id';
import { MessageHandlerDependencies } from './types';

export class FilterStatsHandler {
  constructor(
    private dependencies: MessageHandlerDependencies,
    private isLoaded: () => boolean,
  ) {}
  private pendingFilterSubscribeRequests = new Map<number, Promise<void>>();
  private pendingFilterUnsubscribeRequests = new Map<number, Promise<void>>();

  // Timeouts for delayed auto-unsubscription to avoid premature cleanup during React re-renders
  private filterAutoUnsubscribeTimeouts = new Map<number, NodeJS.Timeout>();
  private filterStatsSubscribableMap = new Map<
    number,
    UpdatableSubscribable<MonitoredFilterStats>
  >();
  private ensureLoaded(): boolean {
    if (!this.isLoaded()) {
      const error = new Error('Service not loaded');
      throw error;
    }
    return true;
  }
  private static generateMessageId(): string {
    return generateID();
  }
  /**
   * Subscribes to filter statistics updates
   */
  public async subscribeToFilterStats(
    idx: number,
    interval = 1000,
  ): Promise<void> {
    this.ensureLoaded();

    // Check if there's already a pending subscribe request for this filter
    const existingRequest = this.pendingFilterSubscribeRequests.get(idx);
    if (existingRequest) {
      return existingRequest;
    }

    // Create and store the promise
    const promise = (async () => {
      try {
        await this.dependencies.send({
          type: WSMessageType.SUBSCRIBE_FILTER_STATS,
          id: FilterStatsHandler.generateMessageId(),
          idx,
          interval,
        });
      } finally {
        // Clear the pending request when done (success or failure)
        this.pendingFilterSubscribeRequests.delete(idx);
      }
    })();

    this.pendingFilterSubscribeRequests.set(idx, promise);
    return promise;
  }

  /**
   * Unsubscribes from filter statistics updates
   */
  public async unsubscribeFromFilterStats(idx: number): Promise<void> {
    this.ensureLoaded();

    // Check if there's already a pending unsubscribe request for this filter
    const existingRequest = this.pendingFilterUnsubscribeRequests.get(idx);
    if (existingRequest) {
      return existingRequest;
    }

    // Create and store the promise
    const promise = (async () => {
      try {
        await this.dependencies.send({
          type: WSMessageType.UNSUBSCRIBE_FILTER_STATS,
          id: FilterStatsHandler.generateMessageId(),
          idx,
        });
      } finally {
        // Clear the pending request when done (success or failure)
        this.pendingFilterUnsubscribeRequests.delete(idx);
      }
    })();

    this.pendingFilterUnsubscribeRequests.set(idx, promise);
    return promise;
  }

  /**
   * Handles filter statistics updates from the server
   */
  public handleFilterStatsUpdate(filter: MonitoredFilterStats): void {
    console.log(
      'Filter stats received from server:',
      JSON.stringify(filter, null, 2),
    );

    const idx = filter.idx;
    const subscribable = this.filterStatsSubscribableMap.get(idx);
    if (subscribable) {
      subscribable.updateDataAndNotify(filter);
    }
  }

  /**
   * Subscribe to filter statistics updates for a specific filter
   * @param idx Filter index to subscribe to
   * @param callback Function called when that filter's stats are updated
   * @param interval Polling interval for server subscription (default: 1000ms)
   * @returns Function to unsubscribe
   */
  public subscribeToFilterStatsUpdates(
    idx: number,
    callback: (filter: MonitoredFilterStats) => void,
    interval = 1000,
  ): () => void {
    // Cancel any pending auto-unsubscribe for this filter since we have a new subscriber
    const existingTimeout = this.filterAutoUnsubscribeTimeouts.get(idx);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.filterAutoUnsubscribeTimeouts.delete(idx);
    }

    let subscribable = this.filterStatsSubscribableMap.get(idx);
    const isFirstSubscriber = !subscribable;

    if (!subscribable) {
      const initialData: MonitoredFilterStats = {
        idx,
        status: 'unknown',
        bytes_done: 0,
        bytes_sent: 0,
        pck_sent: 0,
        pck_done: 0,
        time: 0,
        nb_ipid: 0,
        nb_opid: 0,
      };
      subscribable = new UpdatableSubscribable(initialData);
      this.filterStatsSubscribableMap.set(idx, subscribable);
    }

    const unsubscribe = subscribable.subscribe(
      (data) => {
        if (data) callback(data);
      },
      { immediate: false },
    );

    // If this is the first subscriber, automatically subscribe to server
    if (isFirstSubscriber) {
      this.subscribeToFilterStats(idx, interval).catch(() => {});
    }

    return () => {
      unsubscribe();
      const currentSubscribable = this.filterStatsSubscribableMap.get(idx);
      if (currentSubscribable && !currentSubscribable.hasSubscribers) {
        // Cancel any existing timeout for this filter
        const existingTimeout = this.filterAutoUnsubscribeTimeouts.get(idx);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Schedule unsubscribe after a delay to allow for React re-renders
        const timeoutId = setTimeout(() => {
          this.filterAutoUnsubscribeTimeouts.delete(idx);

          // Double-check there are still no subscribers before unsubscribing
          const subscribable = this.filterStatsSubscribableMap.get(idx);
          if (subscribable && !subscribable.hasSubscribers) {
            this.filterStatsSubscribableMap.delete(idx);

            this.unsubscribeFromFilterStats(idx).catch(() => {});
          }
        }, 100); // 100ms delay to handle React re-renders

        this.filterAutoUnsubscribeTimeouts.set(idx, timeoutId);
      }
    };
  }
}
