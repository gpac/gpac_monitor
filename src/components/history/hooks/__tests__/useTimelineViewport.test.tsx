import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimelineViewport } from '../useTimelineViewport';
import {
  zoomViewportAroundTime,
  centerViewportOnTime,
  type TimelineViewport,
} from '@/utils/history/timelineViewport';

const SESSION_US = 100_000_000;

const fullViewport: TimelineViewport = {
  sessionDurationUs: SESSION_US,
  visibleStartUs: 0,
  visibleDurationUs: SESSION_US,
};

describe('useTimelineViewport', () => {
  it('starts on the full-session window', () => {
    const { result } = renderHook(() => useTimelineViewport(SESSION_US));
    expect(result.current.viewport).toEqual(fullViewport);
  });

  it('zoomAround matches the pure zoom function', () => {
    const { result } = renderHook(() => useTimelineViewport(SESSION_US));
    act(() => result.current.zoomAround(40_000_000, 0.5));
    expect(result.current.viewport).toEqual(
      zoomViewportAroundTime(fullViewport, 40_000_000, 0.5),
    );
  });

  it('centerOn matches the pure center function', () => {
    const { result } = renderHook(() => useTimelineViewport(SESSION_US));
    act(() => result.current.zoomAround(0, 0.2));
    act(() => result.current.centerOn(80_000_000));
    const zoomed = zoomViewportAroundTime(fullViewport, 0, 0.2);
    expect(result.current.viewport).toEqual(
      centerViewportOnTime(zoomed, 80_000_000),
    );
  });

  it('panBy clamps at the bounds', () => {
    const { result } = renderHook(() => useTimelineViewport(SESSION_US));
    act(() => result.current.zoomAround(0, 0.2));
    act(() => result.current.panBy(-50_000_000));
    expect(result.current.viewport.visibleStartUs).toBe(0);
  });

  it('resets to full window when session duration changes', () => {
    const { result, rerender } = renderHook(
      ({ duration }) => useTimelineViewport(duration),
      { initialProps: { duration: SESSION_US } },
    );
    act(() => result.current.zoomAround(40_000_000, 0.5));
    rerender({ duration: 200_000_000 });
    expect(result.current.viewport).toEqual({
      sessionDurationUs: 200_000_000,
      visibleStartUs: 0,
      visibleDurationUs: 200_000_000,
    });
  });
});
