import type { MonitoredFilterStats } from "@/types/domain/gpac"
import { WSMessageType } from '@/services/ws/types';
import { UpdatableSubscribable } from "@/services/utils/UpdatableSubcribable"
import { generateID } from '@/utils/id';
import { MessageHandlerDependencies } from './baseMessageHandler';



export class FilterStatsHandler  {
    constructor(
        private dependencies: MessageHandlerDependencies,
        private isLoaded: () => boolean,
      ) {}
  private pendingFilterSubscribeRequests = new Map<number, Promise<void>>()
  private pendingFilterUnsubscribeRequests = new Map<number, Promise<void>>()

  // Timeouts for delayed auto-unsubscription to avoid premature cleanup during React re-renders
  private filterAutoUnsubscribeTimeouts = new Map<number, NodeJS.Timeout>()
  private filterStatsSubscribableMap = new Map<number, UpdatableSubscribable<MonitoredFilterStats>>()
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
  public async subscribeToFilterStats(idx: number, interval = 1000): Promise<void> {
    this.ensureLoaded();

    // Check if there's already a pending subscribe request for this filter
    const existingRequest = this.pendingFilterSubscribeRequests.get(idx)
    if (existingRequest) {
      console.log(`Filter subscribe request for idx=${idx} already in progress, reusing existing promise`)
      return existingRequest
    }

    // Create and store the promise
    const promise = (async () => {
      try {
        await this.dependencies.send({
          type: WSMessageType.SUBSCRIBE_FILTER_STATS,
          id: FilterStatsHandler.generateMessageId(),
          idx,
          interval
        })
        console.log(`Filter subscribe request for idx=${idx} completed successfully`)
      } finally {
        // Clear the pending request when done (success or failure)
        this.pendingFilterSubscribeRequests.delete(idx)
      }
    })()

    this.pendingFilterSubscribeRequests.set(idx, promise)
    return promise
  }

  /**
   * Unsubscribes from filter statistics updates
   */
  public async unsubscribeFromFilterStats(idx: number): Promise<void> {
    this.ensureLoaded()

    // Check if there's already a pending unsubscribe request for this filter
    const existingRequest = this.pendingFilterUnsubscribeRequests.get(idx)
    if (existingRequest) {
      console.log(`Filter unsubscribe request for idx=${idx} already in progress, reusing existing promise`)
      return existingRequest
    }

    // Create and store the promise
    const promise = (async () => {
      try {
        await this.dependencies.send({
          type: WSMessageType.UNSUBSCRIBE_FILTER_STATS,
          id: FilterStatsHandler.generateMessageId(),
          idx
        })
        console.log(`Filter unsubscribe request for idx=${idx} completed successfully`)
      } finally {
        // Clear the pending request when done (success or failure)
        this.pendingFilterUnsubscribeRequests.delete(idx)
      }
    })()

    this.pendingFilterUnsubscribeRequests.set(idx, promise)
    return promise
  }

  /**
   * Handles filter statistics updates from the server
   */
  public handleFilterStatsUpdate(filter: MonitoredFilterStats): void {
    const idx = filter.idx
    const subscribable = this.filterStatsSubscribableMap.get(idx)
    if (subscribable) {
      console.log(`Handling filter_stats update for idx=${idx}. Notifying subscribers.`) // Log
      subscribable.updateDataAndNotify(filter)
    } else {
      console.log(`Received filter_stats update for idx=${idx}, but no Subscribable found (no active listeners?).`) // Log
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
    interval = 1000
  ): () => void {
    console.log(`New subscription to filter_stats for idx=${idx}.`) 

    // Cancel any pending auto-unsubscribe for this filter since we have a new subscriber
    const existingTimeout = this.filterAutoUnsubscribeTimeouts.get(idx)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
      this.filterAutoUnsubscribeTimeouts.delete(idx)
      console.log(`Cancelled pending filter auto-unsubscribe for idx=${idx} due to new subscriber`)
    }

    let subscribable = this.filterStatsSubscribableMap.get(idx)
    const isFirstSubscriber = !subscribable

    if (!subscribable) {
      const initialData: MonitoredFilterStats = {
        idx,
        status: "unknown",
        bytes_done: 0,
        bytes_sent: 0,
        pck_sent: 0,
        pck_done: 0,
        time: 0,
        nb_ipid: 0,
        nb_opid: 0
      }
      subscribable = new UpdatableSubscribable(initialData)
      this.filterStatsSubscribableMap.set(idx, subscribable)
      console.log(`Created new UpdatableSubscribable for filter_stats idx=${idx}.`) 
    }

    const unsubscribe = subscribable.subscribe(
      (data) => {
        if (data) callback(data)
      },
      { immediate: false }
    )

    // If this is the first subscriber, automatically subscribe to server
    if (isFirstSubscriber) {
      console.log(`First subscriber for filter idx=${idx}, starting server subscription`)
      this.subscribeToFilterStats(idx, interval).catch((error) => {
        console.log(`Error subscribing to filter stats (idx=${idx}) on server: ${error}`, "stderr")
      })
    }

    return () => {
      console.log(`Unsubscribing from filter_stats for idx=${idx}.`) // Log
      unsubscribe()
      const currentSubscribable = this.filterStatsSubscribableMap.get(idx)
      if (currentSubscribable && !currentSubscribable.hasSubscribers) {
        console.log(`No more listeners for filter_stats idx=${idx}. Scheduling delayed auto-unsubscribe from server.`) // Log

        // Cancel any existing timeout for this filter
        const existingTimeout = this.filterAutoUnsubscribeTimeouts.get(idx)
        if (existingTimeout) {
          clearTimeout(existingTimeout)
        }

        // Schedule unsubscribe after a delay to allow for React re-renders
        const timeoutId = setTimeout(() => {
          this.filterAutoUnsubscribeTimeouts.delete(idx)

          // Double-check there are still no subscribers before unsubscribing
          const subscribable = this.filterStatsSubscribableMap.get(idx)
          if (subscribable && !subscribable.hasSubscribers) {
            console.log(`Executing delayed filter auto-unsubscribe for idx=${idx} from server`) // Log
            this.filterStatsSubscribableMap.delete(idx)

            this.unsubscribeFromFilterStats(idx).catch((error) => {
              console.log(`Error unsubscribing from filter stats (idx=${idx}) on server: ${error}`, "stderr")
            })
          } else {
            console.log(`Cancelled filter auto-unsubscribe for idx=${idx} - new subscribers detected`) // Log
          }
        }, 100) // 100ms delay to handle React re-renders

        this.filterAutoUnsubscribeTimeouts.set(idx, timeoutId)
      }
    }
  }
}
