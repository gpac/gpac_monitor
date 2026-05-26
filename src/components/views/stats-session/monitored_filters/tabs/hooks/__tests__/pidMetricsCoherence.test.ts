/**
 * Coherence tests based on GPAC API guarantees.
 * Each invariant is documented with its source behaviour.
 */
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePIDPerformanceStats } from '../usePIDPerformanceStats';
import { usePIDBufferStats } from '../usePIDBufferStats';
import { formatLastTsSent } from '@/utils/formatting';
import { makePID, makeStats } from './fixtures';

// ─── GPAC guaranteed invariants ──────────────────────────────────────────────

describe('average_process_rate <= max_process_rate', () => {
  it('holds after sanitization with valid values', () => {
    const pid = makePID({
      stats: makeStats({
        average_process_rate: 800_000_000,
        max_process_rate: 1_200_000_000,
      }),
    });
    const { result } = renderHook(() => usePIDPerformanceStats(pid));
    const avg = result.current.average_process_rate ?? 0;
    const max = result.current.max_process_rate ?? 0;
    expect(avg).toBeLessThanOrEqual(max);
  });

  it('holds when both are zero (no activity yet)', () => {
    const pid = makePID({
      stats: makeStats({ average_process_rate: 0, max_process_rate: 0 }),
    });
    const { result } = renderHook(() => usePIDPerformanceStats(pid));
    expect(result.current.average_process_rate).toBe(0);
    expect(result.current.max_process_rate).toBe(0);
  });
});

describe('average_bitrate <= max_bitrate (guaranteed by GPAC)', () => {
  it('holds with typical audio values', () => {
    const pid = makePID({
      stats: makeStats({ average_bitrate: 160_000, max_bitrate: 192_000 }),
    });
    const { result } = renderHook(() => usePIDPerformanceStats(pid));
    const avg = result.current.average_bitrate ?? 0;
    const max = result.current.max_bitrate ?? 0;
    expect(avg).toBeLessThanOrEqual(max);
  });
});

describe('total_process_time >= max_process_time (guaranteed by GPAC)', () => {
  it('total (cumulative sum) is always >= peak', () => {
    const pid = makePID({
      stats: makeStats({
        total_process_time: 58_730_000,
        max_process_time: 14,
      }),
    });
    const { result } = renderHook(() => usePIDPerformanceStats(pid));
    expect(result.current.total_process_time).toBeGreaterThanOrEqual(
      result.current.max_process_time,
    );
  });

  it('holds when both are zero', () => {
    const pid = makePID({
      stats: makeStats({ total_process_time: 0, max_process_time: 0 }),
    });
    const { result } = renderHook(() => usePIDPerformanceStats(pid));
    expect(result.current.total_process_time).toBeGreaterThanOrEqual(
      result.current.max_process_time,
    );
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
    expect(result.current.buffer).toBeGreaterThan(result.current.max_buffer!);
  });

  it('would_block is false when buffer is within limit', () => {
    const pid = makePID({
      buffer: 500_000,
      max_buffer: 1_000_000,
      would_block: false,
    });
    const { result } = renderHook(() => usePIDBufferStats(pid));
    expect(result.current.buffer).toBeLessThanOrEqual(
      result.current.max_buffer!,
    );
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
  it('{n: 0, d: timescale} is valid (start of stream, t=0)', () => {
    // d=0 cannot occur in valid data; {n:0, d:1000} means t=0s at timescale 1000
    expect(formatLastTsSent({ n: 0, d: 1000 })).toBe('0.00s');
  });

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

  it('can match in CBR content', () => {
    const pid = makePID({
      bitrate: 160_000,
      stats: makeStats({ average_bitrate: 160_000 }),
    });
    const { result } = renderHook(() => usePIDPerformanceStats(pid));
    expect(result.current.bitrate).toBe(result.current.average_bitrate);
  });
});
