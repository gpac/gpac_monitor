import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFetchIPIDProperties } from '../useFetchIPIDProperties';

const mockUseFilterStats = vi.fn();

vi.mock('@/components/views/stats-session/hooks/stats/useFilterStats', () => ({
  useFilterStats: (...args: unknown[]) => mockUseFilterStats(...args),
}));

const makeIpids = (
  props: Record<string, { name: string; type: string; value: unknown }>,
) => ({
  video_0: { name: 'video', properties: props },
});

describe('useFetchIPIDProperties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFilterStats.mockReturnValue({ stats: null, isLoading: false });
  });

  it('returns empty when filterIdx is undefined', () => {
    const { result } = renderHook(() => useFetchIPIDProperties(undefined, 0));
    expect(result.current).toEqual([]);
  });

  it('returns empty when stats have no ipids', () => {
    mockUseFilterStats.mockReturnValue({ stats: { idx: 1 }, isLoading: false });
    const { result } = renderHook(() => useFetchIPIDProperties(1, 0));
    expect(result.current).toEqual([]);
  });

  it('extracts properties from ipids at correct index', () => {
    const props = {
      Width: { name: 'Width', type: 'uint', value: 1920 },
      Height: { name: 'Height', type: 'uint', value: 1080 },
    };
    mockUseFilterStats.mockReturnValue({
      stats: { idx: 1, ipids: makeIpids(props) },
      isLoading: false,
    });

    const { result } = renderHook(() => useFetchIPIDProperties(1, 0));
    expect(result.current).toEqual([
      { name: 'Width', type: 'uint', value: 1920 },
      { name: 'Height', type: 'uint', value: 1080 },
    ]);
  });

  it('updates properties on source switch (value change)', () => {
    const video1Props = {
      Width: { name: 'Width', type: 'uint', value: 1920 },
      CodecID: { name: 'CodecID', type: 'str', value: 'avc1' },
    };
    mockUseFilterStats.mockReturnValue({
      stats: { idx: 1, ipids: makeIpids(video1Props) },
      isLoading: false,
    });

    const { result, rerender } = renderHook(() => useFetchIPIDProperties(1, 0));
    const firstResult = result.current;
    expect(firstResult[0].value).toBe(1920);

    // Source switch: video2 has different resolution and codec
    const video2Props = {
      Width: { name: 'Width', type: 'uint', value: 1280 },
      CodecID: { name: 'CodecID', type: 'str', value: 'hev1' },
    };
    mockUseFilterStats.mockReturnValue({
      stats: { idx: 1, ipids: makeIpids(video2Props) },
      isLoading: false,
    });

    rerender();
    expect(result.current[0].value).toBe(1280);
    expect(result.current[1].value).toBe('hev1');
    expect(result.current).not.toBe(firstResult);
  });

  it('stabilizes reference when values do not change', () => {
    const props = {
      Width: { name: 'Width', type: 'uint', value: 1920 },
    };
    mockUseFilterStats.mockReturnValue({
      stats: { idx: 1, ipids: makeIpids(props) },
      isLoading: false,
    });

    const { result, rerender } = renderHook(() => useFetchIPIDProperties(1, 0));
    const ref1 = result.current;

    // New ipids object reference, same values
    mockUseFilterStats.mockReturnValue({
      stats: { idx: 1, ipids: makeIpids({ ...props }) },
      isLoading: false,
    });

    rerender();
    expect(result.current).toBe(ref1); // Same reference
  });
});
