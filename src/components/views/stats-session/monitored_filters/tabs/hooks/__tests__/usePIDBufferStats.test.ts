import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePIDBufferStats } from '../usePIDBufferStats';
import { makePID, makeStats } from './fixtures';

describe('usePIDBufferStats — extraction', () => {
  it('always exposes buffer from PIDproperties', () => {
    const pid = makePID({ buffer: 14000 });
    const { result } = renderHook(() => usePIDBufferStats(pid));
    expect(result.current.buffer).toBe(14000);
  });

  it('exposes max_buffer when present', () => {
    const pid = makePID({ buffer: 0, max_buffer: 500_000 });
    const { result } = renderHook(() => usePIDBufferStats(pid));
    expect(result.current.max_buffer).toBe(500_000);
  });

  it('returns null for max_buffer when absent', () => {
    const pid = makePID({ buffer: 0 });
    const { result } = renderHook(() => usePIDBufferStats(pid));
    expect(result.current.max_buffer).toBeNull();
  });

  it('maps optional stats fields to null when absent', () => {
    const pid = makePID({ stats: makeStats() });
    const { result } = renderHook(() => usePIDBufferStats(pid));
    expect(result.current.buffer_time).toBeNull();
    expect(result.current.max_buffer_time).toBeNull();
    expect(result.current.nb_buffer_units).toBeNull();
    expect(result.current.min_playout_time).toBeNull();
    expect(result.current.max_playout_time).toBeNull();
  });

  it('exposes all stats buffer fields when present', () => {
    const pid = makePID({
      stats: makeStats({
        buffer_time: 12000,
        max_buffer_time: 500_000,
        nb_buffer_units: 4,
        min_playout_time: 8000,
        max_playout_time: 20000,
      }),
    });
    const { result } = renderHook(() => usePIDBufferStats(pid));
    expect(result.current.buffer_time).toBe(12000);
    expect(result.current.max_buffer_time).toBe(500_000);
    expect(result.current.nb_buffer_units).toBe(4);
    expect(result.current.min_playout_time).toBe(8000);
    expect(result.current.max_playout_time).toBe(20000);
  });
});

describe('usePIDBufferStats — hasData flag', () => {
  it('is false when buffer is 0 and stats are absent', () => {
    const pid = makePID({ buffer: 0, stats: makeStats() });
    const { result } = renderHook(() => usePIDBufferStats(pid));
    expect(result.current.hasData).toBe(false);
  });

  it('is true when buffer > 0', () => {
    const pid = makePID({ buffer: 1 });
    const { result } = renderHook(() => usePIDBufferStats(pid));
    expect(result.current.hasData).toBe(true);
  });

  it('is true when buffer_time is present', () => {
    const pid = makePID({ stats: makeStats({ buffer_time: 12000 }) });
    const { result } = renderHook(() => usePIDBufferStats(pid));
    expect(result.current.hasData).toBe(true);
  });

  it('is true when nb_buffer_units is present', () => {
    const pid = makePID({ stats: makeStats({ nb_buffer_units: 4 }) });
    const { result } = renderHook(() => usePIDBufferStats(pid));
    expect(result.current.hasData).toBe(true);
  });
});
