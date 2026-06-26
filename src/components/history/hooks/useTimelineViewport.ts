import { useReducer, useEffect, useCallback } from 'react';
import {
  clampViewport,
  zoomViewportAroundTime,
  centerViewportOnTime,
  type TimelineViewport,
} from '@/utils/history/timelineViewport';

type ViewportAction =
  | { type: 'init'; sessionDurationUs: number }
  | { type: 'zoom'; anchorTimeUs: number; zoomFactor: number }
  | { type: 'center'; timeUs: number }
  | { type: 'pan'; deltaUs: number };

function fullViewport(sessionDurationUs: number): TimelineViewport {
  return {
    sessionDurationUs,
    visibleStartUs: 0,
    visibleDurationUs: sessionDurationUs,
  };
}

function viewportReducer(
  viewport: TimelineViewport,
  action: ViewportAction,
): TimelineViewport {
  switch (action.type) {
    case 'init':
      return fullViewport(action.sessionDurationUs);
    case 'zoom':
      return zoomViewportAroundTime(
        viewport,
        action.anchorTimeUs,
        action.zoomFactor,
      );
    case 'center':
      return centerViewportOnTime(viewport, action.timeUs);
    case 'pan':
      return clampViewport({
        ...viewport,
        visibleStartUs: viewport.visibleStartUs + action.deltaUs,
      });
  }
}

/**
 * Local timeline zoom state for the history dock — no Redux.
 * Holds the visible window; whole-UI time sync stays driven by the player.
 */
export function useTimelineViewport(sessionDurationUs: number) {
  const [viewport, dispatch] = useReducer(
    viewportReducer,
    sessionDurationUs,
    fullViewport,
  );

  useEffect(() => {
    dispatch({ type: 'init', sessionDurationUs });
  }, [sessionDurationUs]);

  const zoomAround = useCallback(
    (anchorTimeUs: number, zoomFactor: number) =>
      dispatch({ type: 'zoom', anchorTimeUs, zoomFactor }),
    [],
  );
  const centerOn = useCallback(
    (timeUs: number) => dispatch({ type: 'center', timeUs }),
    [],
  );
  const panBy = useCallback(
    (deltaUs: number) => dispatch({ type: 'pan', deltaUs }),
    [],
  );

  return { viewport, zoomAround, centerOn, panBy };
}
