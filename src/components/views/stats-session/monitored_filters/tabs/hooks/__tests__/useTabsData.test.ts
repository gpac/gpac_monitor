/**
 * Verifies that InputsTab and OutputsTab expose data coming directly from
 * PidDataCollector.js (GPAC) without transformation.
 *
 * Formatting (formatPidBitrate, formatPidBuffer…) only affects display strings
 * and does not alter the underlying values — it is out of scope here.
 * These tests assert on raw numeric values, which is the right level to
 * guarantee that what GPAC sends is what the UI receives.
 */
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInputsTabData } from '../useInputsTabData';
import { useOutputsTabData } from '../useOutputsTabData';
import { makePID, makeStats } from './fixtures';
import type { FilterStatsResponse } from '@/types/domain/gpac/filter-stats';

const makeFilter = (
  overrides: Partial<FilterStatsResponse> = {},
): FilterStatsResponse => ({
  idx: 0,
  status: 'running',
  bytes_done: 0,
  bytes_sent: 0,
  pck_done: 0,
  pck_sent: 0,
  time: 0,
  nb_ipid: 0,
  nb_opid: 0,
  ...overrides,
});

// ─── useInputsTabData ──────────────────────────────────────────────────────

describe('useInputsTabData — passthrough from PidDataCollector ipid_stats', () => {
  it('returns empty array when ipids is absent', () => {
    const { result } = renderHook(() => useInputsTabData(makeFilter()));
    expect(result.current.inputPidsWithIndices).toHaveLength(0);
  });

  it('pidIdx equals 0-based position in ipids object (mirrors loop index i in PidDataCollector)', () => {
    const filter = makeFilter({
      nb_ipid: 2,
      ipids: {
        first: makePID({ name: 'first' }),
        second: makePID({ name: 'second' }),
      },
    });
    const { result } = renderHook(() => useInputsTabData(filter));
    expect(result.current.inputPidsWithIndices[0].pidIdx).toBe(0);
    expect(result.current.inputPidsWithIndices[1].pidIdx).toBe(1);
  });

  it('all ipid_stats fields are passed through unchanged', () => {
    const rawStats = makeStats({
      average_bitrate: 4_217_000,
      max_bitrate: 6_500_000,
      average_process_rate: 867_030_000,
      max_process_rate: 1_200_000_000,
      nb_processed: 312,
      max_process_time: 18,
      total_process_time: 5_400,
    });
    const filter = makeFilter({
      nb_ipid: 1,
      ipids: { 'pid#0': makePID({ stats: rawStats }) },
    });
    const { result } = renderHook(() => useInputsTabData(filter));
    const stats = result.current.inputPidsWithIndices[0].stats;

    expect(stats.average_bitrate).toBe(4_217_000);
    expect(stats.max_bitrate).toBe(6_500_000);
    expect(stats.average_process_rate).toBe(867_030_000);
    expect(stats.max_process_rate).toBe(1_200_000_000);
    expect(stats.nb_processed).toBe(312);
    expect(stats.max_process_time).toBe(18);
    expect(stats.total_process_time).toBe(5_400);
  });

  it('average_process_time (total/nb, computed server-side) is passed through as-is', () => {
    const filter = makeFilter({
      nb_ipid: 1,
      ipids: {
        'pid#0': makePID({
          stats: makeStats({
            average_process_time: 4.226415,
            nb_processed: 53,
          }),
        }),
      },
    });
    const { result } = renderHook(() => useInputsTabData(filter));
    expect(
      result.current.inputPidsWithIndices[0].stats.average_process_time,
    ).toBeCloseTo(4.226415);
  });

  it('average_process_time is absent when PidDataCollector did not compute it (nb_processed = 0)', () => {
    const filter = makeFilter({
      nb_ipid: 1,
      ipids: { 'pid#0': makePID({ stats: makeStats({ nb_processed: 0 }) }) },
    });
    const { result } = renderHook(() => useInputsTabData(filter));
    expect(
      result.current.inputPidsWithIndices[0].stats.average_process_time,
    ).toBeUndefined();
  });
});

// ─── useOutputsTabData ─────────────────────────────────────────────────────

describe('useOutputsTabData — passthrough from PidDataCollector opid_stats', () => {
  it('returns empty array when opids is absent', () => {
    const { result } = renderHook(() => useOutputsTabData(makeFilter()));
    expect(result.current.pidsWithIndices).toHaveLength(0);
  });

  it('pidIdx equals 0-based position in opids object (mirrors loop index i in PidDataCollector)', () => {
    const filter = makeFilter({
      nb_opid: 2,
      opids: {
        first: makePID({ name: 'first' }),
        second: makePID({ name: 'second' }),
      },
    });
    const { result } = renderHook(() => useOutputsTabData(filter));
    expect(result.current.pidsWithIndices[0].pidIdx).toBe(0);
    expect(result.current.pidsWithIndices[1].pidIdx).toBe(1);
  });

  it('all opid_stats fields are passed through unchanged', () => {
    const rawStats = makeStats({
      average_bitrate: 1_500_000,
      max_bitrate: 2_100_000,
      average_process_rate: 500_000_000,
      nb_processed: 120,
      max_process_time: 12,
      total_process_time: 840,
    });
    const filter = makeFilter({
      nb_opid: 1,
      opids: { 'pid#0': makePID({ stats: rawStats }) },
    });
    const { result } = renderHook(() => useOutputsTabData(filter));
    const stats = result.current.pidsWithIndices[0].stats;

    expect(stats.average_bitrate).toBe(1_500_000);
    expect(stats.max_bitrate).toBe(2_100_000);
    expect(stats.average_process_rate).toBe(500_000_000);
    expect(stats.nb_processed).toBe(120);
    expect(stats.max_process_time).toBe(12);
    expect(stats.total_process_time).toBe(840);
  });
});

// ─── ipid vs opid isolation ────────────────────────────────────────────────

describe('ipid and opid stats are isolated for the same filter', () => {
  it('InputsTab reads ipid_stats, OutputsTab reads opid_stats — no cross-contamination', () => {
    const filter = makeFilter({
      nb_ipid: 1,
      nb_opid: 1,
      ipids: {
        'pid#i': makePID({
          name: 'pid#i',
          stats: makeStats({ average_bitrate: 8_000_000 }),
        }),
      },
      opids: {
        'pid#o': makePID({
          name: 'pid#o',
          stats: makeStats({ average_bitrate: 1_500_000 }),
        }),
      },
    });

    const { result: inp } = renderHook(() => useInputsTabData(filter));
    const { result: out } = renderHook(() => useOutputsTabData(filter));

    expect(inp.current.inputPidsWithIndices[0].stats.average_bitrate).toBe(
      8_000_000,
    );
    expect(out.current.pidsWithIndices[0].stats.average_bitrate).toBe(
      1_500_000,
    );
  });

  it('each tab names its own PID', () => {
    const filter = makeFilter({
      nb_ipid: 1,
      nb_opid: 1,
      ipids: { 'pid#i': makePID({ name: 'pid#i' }) },
      opids: { 'pid#o': makePID({ name: 'pid#o' }) },
    });

    const { result: inp } = renderHook(() => useInputsTabData(filter));
    const { result: out } = renderHook(() => useOutputsTabData(filter));

    expect(inp.current.inputPidsWithIndices[0].name).toBe('pid#i');
    expect(out.current.pidsWithIndices[0].name).toBe('pid#o');
  });
});
