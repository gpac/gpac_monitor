import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSubscribedFilters } from './useSubscribedFilters';
import { useGpacService } from './useGpacService';

vi.mock('./useGpacService');

describe('useSubscribedFilters', () => {
  const mockFilterSubscriptionsStore = {
    getSnapshot: vi.fn(),
    subscribe: vi.fn(),
  };

  const mockService = {
    filterSubscriptions: mockFilterSubscriptionsStore,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFilterSubscriptionsStore.getSnapshot.mockReturnValue({
      subscribedFilterIdxs: [],
    });
    mockFilterSubscriptionsStore.subscribe.mockReturnValue(vi.fn());
    vi.mocked(useGpacService).mockReturnValue(mockService as any);
  });

  it('should return empty array on initial load', () => {
    const { result } = renderHook(() => useSubscribedFilters());
    expect(result.current).toEqual([]);
  });

  it('should return initial subscribed filter indices', () => {
    mockFilterSubscriptionsStore.getSnapshot.mockReturnValue({
      subscribedFilterIdxs: [1, 2, 3],
    });

    const { result } = renderHook(() => useSubscribedFilters());
    expect(result.current).toEqual([1, 2, 3]);
  });

  it('should call getSnapshot on service.filterSubscriptions', () => {
    renderHook(() => useSubscribedFilters());
    expect(mockFilterSubscriptionsStore.getSnapshot).toHaveBeenCalled();
  });

  it('should setup subscription on mount', () => {
    const unsubscribe = vi.fn();
    mockFilterSubscriptionsStore.subscribe.mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useSubscribedFilters());

    expect(mockFilterSubscriptionsStore.subscribe).toHaveBeenCalled();

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
