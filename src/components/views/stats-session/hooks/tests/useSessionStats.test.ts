import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSessionStats } from '../useSessionStats';

describe('useSessionStats', () => {
  it('should initialize with empty stats when disabled', () => {
    const { result } = renderHook(() => useSessionStats(false)); // disabled to avoid subscription
    
    expect(result.current.stats).toEqual([]);
    expect(result.current.isSubscribed).toBe(false);
  });

  it('should return stats and subscription status', () => {
    const { result } = renderHook(() => useSessionStats(false));
    
    expect(result.current).toHaveProperty('stats');
    expect(result.current).toHaveProperty('isSubscribed');
  });
});