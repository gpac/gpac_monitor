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
          id: generateID(),
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
        id: generateID(),
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

  private log(message: string, type: 'stdout' | 'stderr' = 'stdout'): void {
    if (type === 'stderr') {
      console.error(message);
    } else {
      console.log(message);
    }
  }

  /**
   * Subscribes to filter args details updates
   * Automatically triggers WebSocket request if first subscriber
   */
  public subscribeToFilterArgsDetails(
    filterIdx: number,
    callback: (args: FilterArgument[]) => void,
  ): () => void {
    this.ensureLoaded();

    let subscribable = this.filterArgsSubscribables.get(filterIdx);
    const isFirstSubscriber = !subscribable;

    if (!subscribable) {
      subscribable = new UpdatableSubscribable<FilterArgument[]>([]);
      this.filterArgsSubscribables.set(filterIdx, subscribable);
    }

    const unsubscribe = subscribable.subscribe(callback, { immediate: false });

    // Trigger WebSocket request only for first subscriber
    if (isFirstSubscriber) {
      this.subscribeToFilterArgs(filterIdx);
    }

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
