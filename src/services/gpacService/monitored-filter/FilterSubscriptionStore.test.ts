import { describe, it, expect, beforeEach } from 'vitest';
import { FilterSubscriptionsStore } from './FilterSubscriptionStore';

describe('FilterSubscriptionsStore', () => {
  let store: FilterSubscriptionsStore;

  beforeEach(() => {
    store = new FilterSubscriptionsStore();
  });

  it('should initialize with empty subscriptions', () => {
    const snapshot = store.getSnapshot();
    expect(snapshot.subscribedFilterIdxs).toEqual([]);
  });

  it('should add filter to subscriptions', () => {
    store.addFilter(1);
    const snapshot = store.getSnapshot();
    expect(snapshot.subscribedFilterIdxs).toContain(1);
  });

  it('should not add duplicate filters', () => {
    store.addFilter(1);
    store.addFilter(1);
    const snapshot = store.getSnapshot();
    expect(snapshot.subscribedFilterIdxs).toEqual([1]);
  });

  it('should add multiple filters', () => {
    store.addFilter(1);
    store.addFilter(2);
    store.addFilter(3);
    const snapshot = store.getSnapshot();
    expect(snapshot.subscribedFilterIdxs).toEqual([1, 2, 3]);
  });

  it('should remove filter from subscriptions', () => {
    store.addFilter(1);
    store.addFilter(2);
    store.removeFilter(1);
    const snapshot = store.getSnapshot();
    expect(snapshot.subscribedFilterIdxs).toEqual([2]);
  });

  it('should clear all subscriptions', () => {
    store.addFilter(1);
    store.addFilter(2);
    store.clear();
    const snapshot = store.getSnapshot();
    expect(snapshot.subscribedFilterIdxs).toEqual([]);
  });

  it('should maintain state across multiple operations', () => {
    store.addFilter(1);
    store.addFilter(2);
    store.removeFilter(1);

    const snapshot = store.getSnapshot();
    expect(snapshot.subscribedFilterIdxs).toEqual([2]);
  });
});
