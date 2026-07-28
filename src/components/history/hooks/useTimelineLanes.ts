import { useMemo } from 'react';
import type { TimelineEvent } from '@/services/historyService/types';
import type { TimelineViewport } from '@/utils/history/timelineViewport';
import { buildLanes } from '../timeline/timelineViewModelBuilders';

/** Façade over the pure lanes builder — feeds the timeline dock's lane rows from real session data. */
export function useTimelineLanes(
  events: TimelineEvent[],
  viewport: TimelineViewport,
) {
  return useMemo(() => buildLanes(viewport, events), [events, viewport]);
}
