import { UpdatableSubscribable } from '@/services/utils/UpdatableSubcribable';
import { WSMessageType } from '@/services/ws/types';
import { SessionFilterStatistics } from '../../../../types/domain/gpac/model';
import { generateID } from '@/utils/core';
import { MessageHandlerDependencies } from './types';

export class SessionStatsHandler {
  constructor(
    private dependencies: MessageHandlerDependencies,
    private isLoaded: () => boolean,
  ) {}
  // Maps to track pending subscription/unsubscription requests
  private pendingSessionSubscribe: Promise<void> | null = null;
  private pendingSessionUnsubscribe: Promise<void> | null = null;

  // Timeouts for delayed auto-unsubscription to avoid premature cleanup during React re-renders
  private sessionAutoUnsubscribeTimeout: NodeJS.Timeout | null = null;

  // Property and methods for statistics management
  private sessionStatsSubscribable = new UpdatableSubscribable<
    SessionFilterStatistics[]
  >([]);

  // logic for subscribing and unsubscribing to session
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

  public async subscribeToSession(interval = 1000): Promise<void> {
    this.ensureLoaded();

    // Check if there's already a pending subscribe request
    if (this.pendingSessionSubscribe) {
      return this.pendingSessionSubscribe;
    }

    // Create and store the promise
    this.pendingSessionSubscribe = (async () => {
      try {
        await this.dependencies.send({
          type: WSMessageType.SUBSCRIBE_SESSION,
          id: SessionStatsHandler.generateMessageId(),
          interval,
        });
      } finally {
        // Clear the pending request when done (success or failure)
        this.pendingSessionSubscribe = null;
      }
    })();

    return this.pendingSessionSubscribe;
  }

  public async unsubscribeFromSession(): Promise<void> {
    this.ensureLoaded();

    // Check if there's already a pending unsubscribe request
    if (this.pendingSessionUnsubscribe) {
      return this.pendingSessionUnsubscribe;
    }

    // Create and store the promise
    this.pendingSessionUnsubscribe = (async () => {
      try {
        await this.dependencies.send({
          type: WSMessageType.UNSUBSCRIBE_SESSION,
          id: SessionStatsHandler.generateMessageId(),
        });
      } finally {
        // Clear the pending request when done (success or failure)
        this.pendingSessionUnsubscribe = null;
      }
    })();

    return this.pendingSessionUnsubscribe;
  }

  public handleSessionStats(stats: SessionFilterStatistics[]): void {
    this.sessionStatsSubscribable.updateDataAndNotify(stats);
  }

  public subscribeToSessionStats(
    callback: (stats: SessionFilterStatistics[]) => void,
    interval = 1000,
  ): () => void {
    // Cancel any pending auto-unsubscribe since we have a new subscriber
    if (this.sessionAutoUnsubscribeTimeout) {
      clearTimeout(this.sessionAutoUnsubscribeTimeout);
      this.sessionAutoUnsubscribeTimeout = null;
    }

    const isFirstSubscriber = !this.sessionStatsSubscribable.hasSubscribers;

    const unsubscribe = this.sessionStatsSubscribable.subscribe(
      (data) => {
        if (data) callback(data);
      },
      { immediate: true },
    );

    // If this is the first subscriber, automatically subscribe to server
    if (isFirstSubscriber) {
      this.subscribeToSession(interval).catch((_error) => {});
    }

    return () => {
      unsubscribe();

      // If no more subscribers, schedule delayed auto-unsubscribe to avoid premature cleanup
      if (!this.sessionStatsSubscribable.hasSubscribers) {
        // Cancel any existing timeout
        if (this.sessionAutoUnsubscribeTimeout) {
          clearTimeout(this.sessionAutoUnsubscribeTimeout);
        }

        // Schedule unsubscribe after a delay to allow for React re-renders
        this.sessionAutoUnsubscribeTimeout = setTimeout(() => {
          this.sessionAutoUnsubscribeTimeout = null;

          // Double-check there are still no subscribers before unsubscribing
          if (!this.sessionStatsSubscribable.hasSubscribers) {
            this.unsubscribeFromSession().catch((_error) => {});
          }
        }, 100); // 100ms delay to handle React re-renders
      }
    };
  }
}
