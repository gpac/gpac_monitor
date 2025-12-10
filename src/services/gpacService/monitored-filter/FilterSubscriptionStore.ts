import { Subscribable } from '@/services/utils/subscribable';
import {
  FilterSubscriptionsState,
  FilerSubscriptionsNotification,
} from '../../../types/domain/gpac/filter-subscriptions';

export class FilterSubscriptionsStore extends Subscribable<
  FilterSubscriptionsState,
  FilerSubscriptionsNotification
> {
  constructor() {
    super({ subscribedFilterIdxs: [] });
  }

  public getSnapshot(): FilterSubscriptionsState {
    return super.getSnapshot();
  }

  public addFilter(filterIdx: number): void {
    if (this.data.subscribedFilterIdxs.includes(filterIdx)) {
      return;
    }
    this.data = {
      ...this.data,
      subscribedFilterIdxs: [...this.data.subscribedFilterIdxs, filterIdx],
    };
    this.notify('FILTER_SUBSCRIPTIONS_CHANGED');
  }

  public removeFilter(filterIdx: number): void {
    const next = this.data.subscribedFilterIdxs.filter(
      (idx) => idx !== filterIdx,
    );
    if (next.length === this.data.subscribedFilterIdxs.length) {
      return;
    }
    this.data = {
      ...this.data,
      subscribedFilterIdxs: next,
    };
    this.notify('FILTER_SUBSCRIPTIONS_CHANGED');
  }
  public clear(): void {
    if (this.data.subscribedFilterIdxs.length === 0) {
      return;
    }
    this.data = {
      subscribedFilterIdxs: [],
    };
    this.notify('FILTER_SUBSCRIPTIONS_CHANGED');
  }
}
