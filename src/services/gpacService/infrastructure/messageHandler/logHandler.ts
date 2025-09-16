import { UpdatableSubscribable } from '@/services/utils/UpdatableSubcribable';
import { WSMessageType } from '@/services/ws/types';
import {
  GpacLogEntry,
  LogManagerStatus,
  GpacLogConfig,
} from '@/types/domain/gpac/log-types';
import { generateID } from '@/utils/id';
import { MessageHandlerDependencies, MessageHandlerCallbacks } from './types';
import { logWorkerService } from '@/services/workers/logWorkerService';

export class LogHandler {
  constructor(
    private dependencies: MessageHandlerDependencies,
    private isLoaded: () => boolean,
    private callbacks?: MessageHandlerCallbacks,
  ) {}

  // Maps to track pending subscription/unsubscription requests
  private pendingLogSubscribe: Promise<void> | null = null;
  private pendingLogUnsubscribe: Promise<void> | null = null;

  // Timeouts for delayed auto-unsubscription to avoid premature cleanup during React re-renders
  private logAutoUnsubscribeTimeout: NodeJS.Timeout | null = null;

  // Track if we're currently subscribed
  private isSubscribed = false;

  // Property and methods for log management
  private logEntriesSubscribable = new UpdatableSubscribable<GpacLogEntry[]>(
    [],
  );
  private logStatusSubscribable =
    new UpdatableSubscribable<LogManagerStatus | null>(null);

  // Worker subscription cleanup
  private workerUnsubscribe: (() => void) | null = null;

  // Logic for subscribing and unsubscribing to logs
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

  public async subscribeToLogs(
    logLevel: GpacLogConfig = 'all@warning',
  ): Promise<void> {
    this.ensureLoaded();

    // If already subscribed, update log level instead
    if (this.isSubscribed) {
      return this.updateLogLevel(logLevel);
    }

    // Check if there's already a pending subscribe request
    if (this.pendingLogSubscribe) {
      return this.pendingLogSubscribe;
    }

    // Create and store the promise
    this.pendingLogSubscribe = (async () => {
      try {
        await this.dependencies.send({
          type: WSMessageType.SUBSCRIBE_LOGS,
          id: LogHandler.generateMessageId(),
          logLevel,
        });
        this.isSubscribed = true;

        // Notify Redux of subscription status
        if (this.callbacks?.onLogSubscriptionChange) {
          this.callbacks.onLogSubscriptionChange(true);
        }
      } finally {
        // Clear the pending request when done (success or failure)
        this.pendingLogSubscribe = null;
      }
    })();

    return this.pendingLogSubscribe;
  }

  public async unsubscribeFromLogs(): Promise<void> {
    this.ensureLoaded();

    // Check if there's already a pending unsubscribe request
    if (this.pendingLogUnsubscribe) {
      return this.pendingLogUnsubscribe;
    }

    // Create and store the promise
    this.pendingLogUnsubscribe = (async () => {
      try {
        await this.dependencies.send({
          type: WSMessageType.UNSUBSCRIBE_LOGS,
          id: LogHandler.generateMessageId(),
        });
        this.isSubscribed = false;

        // Notify Redux of subscription status
        if (this.callbacks?.onLogSubscriptionChange) {
          this.callbacks.onLogSubscriptionChange(false);
        }
      } finally {
        // Clear the pending request when done (success or failure)
        this.pendingLogUnsubscribe = null;
      }
    })();

    return this.pendingLogUnsubscribe;
  }

  public async updateLogLevel(logLevel: GpacLogConfig): Promise<void> {
    this.ensureLoaded();

    await this.dependencies.send({
      type: WSMessageType.UPDATE_LOG_LEVEL,
      id: LogHandler.generateMessageId(),
      logLevel,
    });
  }

  public async getLogStatus(): Promise<void> {
    this.ensureLoaded();

    await this.dependencies.send({
      type: WSMessageType.GET_LOG_STATUS,
      id: LogHandler.generateMessageId(),
    });
  }

  public handleLogBatch(logs: GpacLogEntry[]): void {
    // Send to worker for processing
    logWorkerService.processLogs(logs);

    // Send directly to Redux for immediate UI update
    if (this.callbacks?.onLogsUpdate) {
      this.callbacks.onLogsUpdate(logs);
    }
  }

  public handleLogHistory(logs: GpacLogEntry[]): void {
    // Keep the existing subscribable for backward compatibility
    this.logEntriesSubscribable.updateDataAndNotify(logs);

    // Send to Redux for immediate UI update
    if (this.callbacks?.onLogsUpdate) {
      this.callbacks.onLogsUpdate(logs);
    }
  }

  public handleLogStatus(status: LogManagerStatus): void {
    this.logStatusSubscribable.updateDataAndNotify(status);
  }

  public handleLogConfigChanged(logLevel: GpacLogConfig): void {
    // Update status if we have one
    const currentStatus = this.logStatusSubscribable.getSnapshot();
    if (currentStatus) {
      const updatedStatus = {
        ...currentStatus,
        logLevel,
      };
      this.logStatusSubscribable.updateDataAndNotify(updatedStatus);
    }
  }

  public subscribeToLogEntries(
    callback: (logs: GpacLogEntry[]) => void,
    logLevel: GpacLogConfig = 'all@warning',
  ): () => void {
    // Cancel any pending auto-unsubscribe since we have a new subscriber
    if (this.logAutoUnsubscribeTimeout) {
      clearTimeout(this.logAutoUnsubscribeTimeout);
      this.logAutoUnsubscribeTimeout = null;
    }

    const isFirstSubscriber = !this.logEntriesSubscribable.hasSubscribers;

    // Subscribe to logs processed by the Worker
    if (!this.workerUnsubscribe) {
      this.workerUnsubscribe = logWorkerService.subscribe((processedLogs) => {
        this.logEntriesSubscribable.updateDataAndNotify(processedLogs);
      });
    }

    const unsubscribe = this.logEntriesSubscribable.subscribe(
      (data) => {
        if (data) callback(data);
      },
      { immediate: true },
    );

    // If this is the first subscriber, automatically subscribe to server
    if (isFirstSubscriber) {
      this.subscribeToLogs(logLevel).catch((_error) => {});
    }

    return () => {
      unsubscribe();

      // If no more subscribers, schedule delayed auto-unsubscribe to avoid premature cleanup
      if (!this.logEntriesSubscribable.hasSubscribers) {
        // Cancel any existing timeout
        if (this.logAutoUnsubscribeTimeout) {
          clearTimeout(this.logAutoUnsubscribeTimeout);
        }
        // Clean up the Worker subscription
        if (this.workerUnsubscribe) {
          this.workerUnsubscribe();
          this.workerUnsubscribe = null;
        }

        // Schedule unsubscribe after a delay to allow for React re-renders
        this.logAutoUnsubscribeTimeout = setTimeout(() => {
          this.logAutoUnsubscribeTimeout = null;

          // Double-check there are still no subscribers before unsubscribing
          if (!this.logEntriesSubscribable.hasSubscribers) {
            this.unsubscribeFromLogs().catch((_error) => {});
          }
        }, 100); // 100ms delay to handle React re-renders
      }
    };
  }

  public subscribeToLogStatus(
    callback: (status: LogManagerStatus | null) => void,
  ): () => void {
    return this.logStatusSubscribable.subscribe((data) => callback(data), {
      immediate: true,
    });
  }
}
