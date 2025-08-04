import type { CPUStats } from '@/types/domain/system/index';

import { UpdatableSubscribable } from '@/services/utils/UpdatableSubcribable';
import { WSMessageType } from '@/services/ws/types';
import { MessageHandlerDependencies } from './types';

import { generateID } from '@/utils/id';

export class CPUStatsHandler {
  constructor(
    private dependencies: MessageHandlerDependencies,
    private isLoaded: () => boolean,
  ) {}
  // Maps to track pending subscription/unsubscription requests
  private pendingCPUStatsSubscribe: Promise<void> | null = null;
  private pendingCPUStatsUnsubscribe: Promise<void> | null = null;

  // Timeouts for delayed auto-unsubscription to avoid premature cleanup during React re-renders
  private cpuAutoUnsubscribeTimeout: NodeJS.Timeout | null = null;
  // Property and methods for statistics management
  private cpuStatsSubscribable = new UpdatableSubscribable<CPUStats[]>([]);
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
  // logic for subscribing and unsubscribing to cpu stats
  public async subscribeToCPUStats(interval = 50): Promise<void> {
    this.ensureLoaded();

    // Check if there's already a pending subscribe request
    if (this.pendingCPUStatsSubscribe) {
      console.log(
        'CPU Stats subscribe request already in progress, reusing existing promise',
      );
      return this.pendingCPUStatsSubscribe;
    }

    // Create and store the promise
    this.pendingCPUStatsSubscribe = (async () => {
      try {
        await this.dependencies.send({
          type: WSMessageType.SUBSCRIBE_CPU_STATS,
          id: CPUStatsHandler.generateMessageId(),
          interval,
        });
        console.log('CPU Stats subscribe request completed successfully');
      } finally {
        this.pendingCPUStatsSubscribe = null;
      }
    })();

    return this.pendingCPUStatsSubscribe;
  }

  public async unsubscribeFromCPUStats(): Promise<void> {
    this.ensureLoaded();

    // Check if there's already a pending unsubscribe request
    if (this.pendingCPUStatsUnsubscribe) {
      console.log(
        'CPU Stats unsubscribe request already in progress, reusing existing promise',
      );
      return this.pendingCPUStatsUnsubscribe;
    }

    // Create and store the promise
    this.pendingCPUStatsUnsubscribe = (async () => {
      try {
        await this.dependencies.send({
          type: WSMessageType.UNSUBSCRIBE_CPU_STATS,
          id: CPUStatsHandler.generateMessageId(),
        });
        console.log('CPU Stats unsubscribe request completed successfully');
      } finally {
        // Clear the pending request when done (success or failure)
        this.pendingCPUStatsUnsubscribe = null;
      }
    })();

    return this.pendingCPUStatsUnsubscribe;
  }
  public handleCPUStats(stats: CPUStats): void {
    console.log('[CPUStatsHandler] handleCPUStats called with:', {
      timestamp: stats?.timestamp,
      processUsage: stats?.process_cpu_usage,
      processMemory: stats?.process_memory,
      nbCores: stats?.nb_cores,
      hasSubscribers: this.cpuStatsSubscribable.hasSubscribers
    });
    
    if (!stats) {
      console.warn('[CPUStatsHandler] Received null/undefined stats data');
      return;
    }
    
    this.cpuStatsSubscribable.updateDataAndNotify([stats]);
    console.log('[CPUStatsHandler] Stats updated and subscribers notified');
  }
  public subscribeToCPUStatsUpdates(
    callback: (stats: CPUStats) => void,
    interval = 50,
  ): () => void {
    console.log('New subscription to CPU stats.');

    // Cancel any pending auto-unsubscribe since we have a new subscriber
    if (this.cpuAutoUnsubscribeTimeout) {
      clearTimeout(this.cpuAutoUnsubscribeTimeout);
      this.cpuAutoUnsubscribeTimeout = null;
      console.log(
        'Cancelled pending CPU auto-unsubscribe due to new subscriber',
      );
    }

    const isFirstSubscriber = !this.cpuStatsSubscribable.hasSubscribers;

    const unsubscribe = this.cpuStatsSubscribable.subscribe(
      (data) => {
        if (data && data.length > 0) callback(data[data.length - 1]);
      },
      { immediate: false },
    );

    // If this is the first subscriber, automatically subscribe to server
    if (isFirstSubscriber) {
      console.log(
        'First subscriber for cpu stats, starting server subscription',
      );
      this.subscribeToCPUStats(interval).catch((error) => {
        console.log(
          `Error subscribing to cpu stats on server: ${error}`,
          'stderr',
        );
      });
    }

    return () => {
      console.log('Unsubscribing from cpu stats.');
      unsubscribe();

      // If no more subscribers, schedule delayed auto-unsubscribe to avoid premature cleanup
      if (!this.cpuStatsSubscribable.hasSubscribers) {
        console.log(
          'No more listeners for cpu stats. Scheduling delayed auto-unsubscribe from server.',
        ); // Log

        // Cancel any existing timeout
        if (this.cpuAutoUnsubscribeTimeout) {
          clearTimeout(this.cpuAutoUnsubscribeTimeout);
        }

        // Schedule unsubscribe after a delay to allow for React re-renders
        this.cpuAutoUnsubscribeTimeout = setTimeout(() => {
          this.cpuAutoUnsubscribeTimeout = null;

          // Double-check there are still no subscribers before unsubscribing
          if (!this.cpuStatsSubscribable.hasSubscribers) {
            console.log('Executing delayed cpu auto-unsubscribe from server'); // Log
            this.unsubscribeFromCPUStats().catch((error) => {
              console.log(
                `Error unsubscribing from cpu stats on server: ${error}`,
                'stderr',
              );
            });
          } else {
            console.log(
              'Cancelled cpu auto-unsubscribe - new subscribers detected',
            ); // Log
          }
        }, 100); // 100ms delay to handle React re-renders
      }
    };
  }
}
