export const MIN_VISIBLE_DURATION_US = 1_000_000;

export interface TimelineViewport {
  sessionDurationUs: number;
  visibleStartUs: number;
  visibleDurationUs: number;
}

/** Keeps the visible window inside [0, sessionDuration]; never mutates the input. */
export function clampViewport(viewport: TimelineViewport): TimelineViewport {
  const visibleDurationUs = Math.max(
    MIN_VISIBLE_DURATION_US,
    Math.min(viewport.visibleDurationUs, viewport.sessionDurationUs),
  );
  const maxVisibleStartUs = viewport.sessionDurationUs - visibleDurationUs;
  const visibleStartUs = Math.max(
    0,
    Math.min(viewport.visibleStartUs, maxVisibleStartUs),
  );
  return { ...viewport, visibleStartUs, visibleDurationUs };
}

/** Zooms the window by zoomFactor while keeping anchorTimeUs at the same ratio. */
export function zoomViewportAroundTime(
  viewport: TimelineViewport,
  anchorTimeUs: number,
  zoomFactor: number,
): TimelineViewport {
  const nextVisibleDurationUs = Math.max(
    MIN_VISIBLE_DURATION_US,
    Math.min(
      viewport.sessionDurationUs,
      viewport.visibleDurationUs * zoomFactor,
    ),
  );
  const anchorRatio =
    (anchorTimeUs - viewport.visibleStartUs) / viewport.visibleDurationUs;
  const visibleStartUs = anchorTimeUs - nextVisibleDurationUs * anchorRatio;
  return clampViewport({
    ...viewport,
    visibleStartUs,
    visibleDurationUs: nextVisibleDurationUs,
  });
}

/** Centers the visible window on timeUs without changing its duration. */
export function centerViewportOnTime(
  viewport: TimelineViewport,
  timeUs: number,
): TimelineViewport {
  return clampViewport({
    ...viewport,
    visibleStartUs: timeUs - viewport.visibleDurationUs / 2,
  });
}
