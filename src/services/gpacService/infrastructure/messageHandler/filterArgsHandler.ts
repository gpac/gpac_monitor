import { WSMessageType } from '@/services/ws/types';
import { generateID } from '@/utils/id';
import { MessageHandlerDependencies } from './types';
import { UpdatableSubscribable } from '@/services/utils/UpdatableSubcribable';
import { FilterArgument } from '@/types';
import { convertEnumIndexToValue } from '@/utils/filtersArguments';

interface UpdateArgResult {
  success: boolean;
  actualValue: any;
  error?: string;
}

interface PendingUpdate {
  resolve: (value: UpdateArgResult) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

export class FilterArgsHandler {
  constructor(
    private dependencies: MessageHandlerDependencies,
    private isLoaded: () => boolean,
  ) {}
  private pendingFilterArgsSubscribeRequests = new Map<number, Promise<void>>();
  private pendingFilterArgsUnsubscribeRequests = new Map<
    number,
    Promise<void>
  >();

  private filterArgsSubscribables = new Map<
    number,
    UpdatableSubscribable<FilterArgument[]>
  >();

  // Store pending update promises
  private pendingUpdates = new Map<string, PendingUpdate>();

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
   * Subscribes to filter args
   */
  public async subscribeToFilterArgs(idx: number): Promise<void> {
    this.ensureLoaded();

    // Check if there's already a pending subscribe request for this filter
    const existingRequest = this.pendingFilterArgsSubscribeRequests.get(idx);
    if (existingRequest) {
      return existingRequest;
    }

    // Create and store the promise
    const promise = (async () => {
      try {
        await this.dependencies.send({
          type: WSMessageType.FILTER_ARGS_DETAILS,
          id: FilterArgsHandler.generateMessageId(),
          idx,
        });
      } finally {
        // Clear the pending request when done (success or failure)
        this.pendingFilterArgsSubscribeRequests.delete(idx);
      }
    })();

    this.pendingFilterArgsSubscribeRequests.set(idx, promise);
    return promise;
  }

  /**
   * Unsubscribes from filter arguments updates
   */
  public async unsubscribeFromFilterArgs(idx: number): Promise<void> {
    this.ensureLoaded();

    // Check if there's already a pending unsubscribe request for this filter
    const existingRequest = this.pendingFilterArgsUnsubscribeRequests.get(idx);
    if (existingRequest) {
      return existingRequest;
    }

    // Create and store the promise
    const promise = (async () => {
      try {
        await this.dependencies.send({
          type: WSMessageType.STOP_FILTER_ARGS,
          id: FilterArgsHandler.generateMessageId(),
          idx,
        });
      } finally {
        // Clear the pending request when done (success or failure)
        this.pendingFilterArgsUnsubscribeRequests.delete(idx);
      }
    })();

    this.pendingFilterArgsUnsubscribeRequests.set(idx, promise);
    return promise;
  }

  /**
   * Handles filter args details received from server
   */
  public handleFilterArgs(data: any): void {
    if (!data.filter || data.filter.idx === undefined) {
      return;
    }

    const filterIdx = data.filter.idx;
    const subscribable = this.filterArgsSubscribables.get(filterIdx);

    if (subscribable && data.filter.gpac_args) {
      subscribable.updateDataAndNotify(data.filter.gpac_args);
    }
  }

  /**
   * Update a filter argument and wait for server confirmation
   */
  public async updateFilterArg(
    idx: number,
    name: string,
    argName: string,
    newValue: string | number | boolean,
  ): Promise<UpdateArgResult> {
    this.ensureLoaded();

    const key = `${idx}_${argName}`;

    // Create a promise that will be resolved when server responds
    const promise = new Promise<UpdateArgResult>((resolve, reject) => {
      // Set a timeout of 5 seconds
      const timeout = setTimeout(() => {
        this.pendingUpdates.delete(key);
        reject(new Error('Update request timed out after 5 seconds'));
      }, 5000);

      this.pendingUpdates.set(key, { resolve, reject, timeout });
    });

    try {
      this.log(
        `Updating argument '${argName}' for filter ${name} (idx=${idx}) to value: ${newValue}`,
      );

      await this.dependencies.send({
        type: WSMessageType.UPDATE_ARG,
        id: FilterArgsHandler.generateMessageId(),
        idx,
        name,
        argName,
        newValue,
      });

      // Wait for server response
      const result = await promise;

      this.log(
        `Update result for '${argName}': success=${result.success}, actualValue=${result.actualValue}`,
      );

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.log(
        `Error updating filter argument '${argName}' for ${name} (idx=${idx}): ${errorMessage}`,
        'stderr',
      );
      throw error;
    }
  }

  /**
   * Handle update_arg_response from server
   */
  public handleUpdateArgResponse(data: any): void {
    if (!data.idx || !data.argName) {
      this.log('Invalid update_arg_response: missing idx or argName', 'stderr');
      return;
    }

    const key = `${data.idx}_${data.argName}`;
    const pending = this.pendingUpdates.get(key);

    if (!pending) {
      this.log(`No pending update found for ${key}`, 'stderr');
      return;
    }

    // Clear the timeout
    clearTimeout(pending.timeout);

    // Remove from pending
    this.pendingUpdates.delete(key);

    // Convert enum index to value if needed
    let actualValue = data.actualValue;
    if (data.success && actualValue !== undefined) {
      const subscribable = this.filterArgsSubscribables.get(data.idx);
      if (subscribable) {
        const currentArgs = subscribable.getSnapshot();
        const arg = currentArgs.find((a) => a.name === data.argName);

        // If this is an enum argument, convert index to value
        // Note: min_max_enum is sent from GPAC but not in the FilterArgument type
        const minMaxEnum = (arg as any)?.min_max_enum;
        if (minMaxEnum) {
          actualValue = convertEnumIndexToValue(actualValue, minMaxEnum);
          this.log(
            `Converted enum index ${data.actualValue} to value '${actualValue}' for ${data.argName}`,
          );
        }
      }
    }

    // Resolve the promise with converted value
    const result: UpdateArgResult = {
      success: data.success,
      actualValue: actualValue,
      error: data.error,
    };

    pending.resolve(result);

    // If successful, update the local cache with converted value
    if (data.success && actualValue !== undefined) {
      const subscribable = this.filterArgsSubscribables.get(data.idx);
      if (subscribable) {
        const currentArgs = subscribable.getSnapshot();
        const updatedArgs = currentArgs.map((arg) =>
          arg.name === data.argName ? { ...arg, value: actualValue } : arg,
        );
        subscribable.updateDataAndNotify(updatedArgs);
      }
    }
  }

  private log(message: string, type: 'stdout' | 'stderr' = 'stdout'): void {
    if (type === 'stderr') {
      console.error(message);
    } else {
      console.log(message);
    }
  }

  /**
   * Subscribes to filter args details updates
   */
  public subscribeToFilterArgsDetails(
    filterIdx: number,
    callback: (args: FilterArgument[]) => void,
    _interval = 1000, // Pas utilisé car on ne reçoit qu'une fois
  ): () => void {
    this.ensureLoaded();

    let subscribable = this.filterArgsSubscribables.get(filterIdx);
    if (!subscribable) {
      subscribable = new UpdatableSubscribable<FilterArgument[]>([]);
      this.filterArgsSubscribables.set(filterIdx, subscribable);
    }

    const unsubscribe = subscribable.subscribe(callback, { immediate: false });

    return () => {
      unsubscribe();
      // Cleanup si plus d'abonnés
      if (!subscribable!.hasSubscribers) {
        this.filterArgsSubscribables.delete(filterIdx);
      }
    };
  }

  /**
   * Cleanup all subscriptions
   */
  public cleanup(): void {
    this.filterArgsSubscribables.clear();
  }
}
