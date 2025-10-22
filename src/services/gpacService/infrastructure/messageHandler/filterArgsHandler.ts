import { WSMessageType } from '@/services/ws/types';
import { generateID } from '@/utils/core';
import { MessageHandlerDependencies } from './types';
import { UpdatableSubscribable } from '@/services/utils/UpdatableSubcribable';
import { FilterArgument } from '@/types';

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
   * Update a filter argument
   */
  public async updateFilterArg(
    idx: number,
    name: string,
    argName: string,
    newValue: string | number | boolean,
  ): Promise<void> {
    this.ensureLoaded();

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

      this.log(
        `Successfully updated argument '${argName}' for filter ${name} (idx=${idx})`,
      );
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
   * Handle update_arg_response from server (no longer used with fire-and-forget)
   */
  public handleUpdateArgResponse(_data: any): void {
    // No-op: we use fire-and-forget approach now
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
