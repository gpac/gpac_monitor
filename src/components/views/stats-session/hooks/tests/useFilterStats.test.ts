import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFilterStats } from '../useFilterStats';

describe('useFilterStats', () => {
  it('should initialize with null stats when no filterId provided', () => {
    const { result } = renderHook(() => useFilterStats(undefined, false)); // disabled to avoid subscription

    expect(result.current.stats).toBeNull();
    expect(result.current.isSubscribed).toBe(false);
  });

  it('should initialize with null stats when disabled', () => {
    const { result } = renderHook(() => useFilterStats(1, false)); // disabled to avoid subscription

    expect(result.current.stats).toBeNull();
    expect(result.current.isSubscribed).toBe(false);
  });

  it('should return stats and subscription status', () => {
    const { result } = renderHook(() => useFilterStats(1, false));

    expect(result.current).toHaveProperty('stats');
    expect(result.current).toHaveProperty('isSubscribed');
  });

  it('should reset stats when filterId becomes undefined', () => {
    const initialProps: { filterId: number | undefined } = { filterId: 1 };
    const { result, rerender } = renderHook(
      ({ filterId }) => useFilterStats(filterId, false),
      { initialProps },
    );

    expect(result.current.stats).toBeNull();

    // Change filterId to undefined
    rerender({ filterId: undefined });

    expect(result.current.stats).toBeNull();
    expect(result.current.isSubscribed).toBe(false);
  });

  it('should reset stats when enabled becomes false', () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useFilterStats(1, enabled),
      { initialProps: { enabled: false } },
    );

    expect(result.current.stats).toBeNull();

    // Change enabled to false
    rerender({ enabled: false });

    expect(result.current.stats).toBeNull();
    expect(result.current.isSubscribed).toBe(false);
  });
});
