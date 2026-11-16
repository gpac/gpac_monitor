import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePIDPerformanceStats } from '../usePIDPerformanceStats';
import { usePIDBufferStats } from '../usePIDBufferStats';
import { formatLastTsSent } from '@/utils/formatting';
import { makePID, makeStats } from './fixtures';

describe('average_process_rate <= max_process_rate', () => {
  it('holds when both are zero (no activity yet)', () => {
    const pid = makePID({
      stats: makeStats({ average_process_rate: 0, max_process_rate: 0 }),
    });
    const { result } = renderHook(() => usePIDPerformanceStats(pid));
    expect(result.current.average_process_rate).toBe(0);
    expect(result.current.max_process_rate).toBe(0);
  });
});

describe('nb_processed = 0 with total_process_time > 0 (valid init state)', () => {
  it('is accepted as a valid state — filter scheduled but no packet finalised yet', () => {
    const pid = makePID({
      stats: makeStats({ nb_processed: 0, total_process_time: 5000 }),
    });
    const { result } = renderHook(() => usePIDPerformanceStats(pid));
    expect(result.current.nb_processed).toBe(0);
    expect(result.current.total_process_time).toBe(5000);
  });
});

// ─── Buffer behaviour ─────────────────────────────────────────────────────────

describe('buffer can temporarily exceed max_buffer (transitional state)', () => {
  it('usePIDBufferStats returns both values as-is — no clamping', () => {
    // GPAC signals would_block=true when buffer > max_buffer
    const pid = makePID({
      buffer: 1_060_000,
      max_buffer: 1_000_000,
      would_block: true,
    });
    const { result } = renderHook(() => usePIDBufferStats(pid));
    expect(result.current.buffer).toBe(1_060_000);
    expect(result.current.max_buffer).toBe(1_000_000);
  });
});

// ─── disconnected state ───────────────────────────────────────────────────────

describe('disconnected: true — stats are stale', () => {
  it('hook still returns values — UI layer must check disconnected flag', () => {
    const pid = makePID({
      stats: makeStats({
        disconnected: true,
        average_process_rate: 500_000,
        average_bitrate: 160_000,
      }),
    });
    const { result } = renderHook(() => usePIDPerformanceStats(pid));
    expect(result.current.disconnected).toBe(true);
    // Values are still present — caller decides whether to display them
    expect(result.current.average_process_rate).toBe(500_000);
  });
});

// ─── last_ts_sent ─────────────────────────────────────────────────────────────

describe('last_ts_sent — GPAC fraction formats', () => {
  it('{n: 0, d: 0} is defended against (invalid — no timescale)', () => {
    expect(formatLastTsSent({ n: 0, d: 0 })).toBe('—');
  });
});

// ─── pid.bitrate vs stats.average_bitrate (VBR) ──────────────────────────────

describe('pid.bitrate (declared) vs stats.average_bitrate (measured)', () => {
  it('can diverge significantly in VBR content', () => {
    const pid = makePID({
      bitrate: 5_000_000, // declared in header
      stats: makeStats({ average_bitrate: 3_200_000 }), // measured runtime (VBR scene)
    });
    const { result } = renderHook(() => usePIDPerformanceStats(pid));
    // Both valid — divergence is expected and not an error
    expect(result.current.bitrate).toBe(5_000_000);
    expect(result.current.average_bitrate).toBe(3_200_000);
    expect(result.current.bitrate).not.toBe(result.current.average_bitrate);
  });
});
