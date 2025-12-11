import { Subscribable } from '@/services/utils/subscribable';
import {
  FilterSubscriptionsState,
  FilerSubscriptionsNotification,
} from '../../../types/domain/gpac/filter-subscriptions';

export class FilterSubscriptionsStore extends Subscribable<
  FilterSubscriptionsState,
  FilerSubscriptionsNotification
> {
  // Internal counter: filterIdx -> number of active subscriptions
  // Uses ref counting to handle React StrictMode side effects (double render/mount)
  private refCounts = new Map<number, number>();

  constructor() {
    super({ subscribedFilterIdxs: [] });
  }

  private updateStateFromRefCounts() {
    const subscribedFilterIdxs = Array.from(this.refCounts.entries())
      .filter(([, count]) => count > 0)
      .map(([idx]) => idx)
      .sort((a, b) => a - b);

    this.data = { subscribedFilterIdxs };
  }

  public addFilter(filterIdx: number): void {
    // Increment ref count to handle React StrictMode double mounting
    const prevCount = this.refCounts.get(filterIdx) ?? 0;
    const nextCount = prevCount + 1;
    this.refCounts.set(filterIdx, nextCount);

    if (prevCount === 0) {
      this.updateStateFromRefCounts();
      this.notify('FILTER_SUBSCRIPTIONS_CHANGED');
    }
  }

  public removeFilter(filterIdx: number): void {
    // Decrement ref count to handle React StrictMode double unmounting
    const prevCount = this.refCounts.get(filterIdx) ?? 0;

    if (prevCount === 0) {
      return;
    }

    const nextCount = prevCount - 1;

    if (nextCount <= 0) {
      this.refCounts.delete(filterIdx);
    } else {
      this.refCounts.set(filterIdx, nextCount);
    }

    // Only notify when going from 1 -> 0 (last subscriber leaves)
    if (nextCount === 0) {
      this.updateStateFromRefCounts();
      this.notify('FILTER_SUBSCRIPTIONS_CHANGED');
    }
  }

  public clear(): void {
    if (this.refCounts.size === 0) {
      return;
    }

    this.refCounts.clear();
    this.updateStateFromRefCounts();
    this.notify('FILTER_SUBSCRIPTIONS_CHANGED');
  }
}
