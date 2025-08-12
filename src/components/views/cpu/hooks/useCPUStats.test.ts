import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCPUStats } from './useCPUStats';

describe('useCPUStats', () => {
  it('should initialize with empty stats array when disabled', () => {
    const { result } = renderHook(() => useCPUStats(false)); // disabled to avoid subscription

    expect(result.current.stats).toEqual([]);
    expect(result.current.isSubscribed).toBe(false);
  });

  it('should return stats and subscription status', () => {
    const { result } = renderHook(() => useCPUStats(false));

    expect(result.current).toHaveProperty('stats');
    expect(result.current).toHaveProperty('isSubscribed');
  });
});
