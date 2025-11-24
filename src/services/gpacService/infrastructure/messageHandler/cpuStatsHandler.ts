import type { CPUStats } from '@/types/domain/system/index';

import { UpdatableSubscribable } from '@/services/utils/UpdatableSubcribable';
import { WSMessageType } from '@/services/ws/types';
import { MessageHandlerDependencies } from './types';

import { generateID } from '@/utils/core';

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
  // logic for subscribing and unsubscribing to cpu stats
  public async subscribeToCPUStats(interval = 150): Promise<void> {
    this.ensureLoaded();

    // Check if there's already a pending subscribe request
    if (this.pendingCPUStatsSubscribe) {
      return this.pendingCPUStatsSubscribe;
    }

    // Create and store the promise
    this.pendingCPUStatsSubscribe = (async () => {
      try {
        await this.dependencies.send({
          type: WSMessageType.SUBSCRIBE_CPU_STATS,
          id: generateID(),
          interval,
        });
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
      return this.pendingCPUStatsUnsubscribe;
    }

    // Create and store the promise
    this.pendingCPUStatsUnsubscribe = (async () => {
      try {
        await this.dependencies.send({
          type: WSMessageType.UNSUBSCRIBE_CPU_STATS,
          id: generateID(),
        });
      } finally {
        // Clear the pending request when done (success or failure)
        this.pendingCPUStatsUnsubscribe = null;
      }
    })();

    return this.pendingCPUStatsUnsubscribe;
  }
  public handleCPUStats(stats: CPUStats): void {
    if (!stats) {
      return;
    }

    this.cpuStatsSubscribable.updateDataAndNotify([stats]);
  }
  public subscribeToCPUStatsUpdates(
    callback: (stats: CPUStats) => void,
    interval = 150,
  ): () => void {
    // Cancel any pending auto-unsubscribe since we have a new subscriber
    if (this.cpuAutoUnsubscribeTimeout) {
      clearTimeout(this.cpuAutoUnsubscribeTimeout);
      this.cpuAutoUnsubscribeTimeout = null;
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
      this.subscribeToCPUStats(interval).catch(() => {});
    }

    return () => {
      unsubscribe();

      // If no more subscribers, schedule delayed auto-unsubscribe to avoid premature cleanup
      if (!this.cpuStatsSubscribable.hasSubscribers) {
        // Cancel any existing timeout
        if (this.cpuAutoUnsubscribeTimeout) {
          clearTimeout(this.cpuAutoUnsubscribeTimeout);
        }

        // Schedule unsubscribe after a delay to allow for React re-renders
        this.cpuAutoUnsubscribeTimeout = setTimeout(() => {
          this.cpuAutoUnsubscribeTimeout = null;

          // Double-check there are still no subscribers before unsubscribing
          if (!this.cpuStatsSubscribable.hasSubscribers) {
            this.unsubscribeFromCPUStats().catch(() => {});
          }
        }, 100); // 100ms delay to handle React re-renders
      }
    };
  }
}
