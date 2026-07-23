import type {
  TimelineEvent,
  TimelineEventType,
} from '@/services/historyService/types';
import type { TimelineViewport } from '@/utils/history/timelineViewport';
import {
  clusterVisibleEvents,
  getVisibleEvents,
} from '@/utils/history/timelineViewportView';
import type {
  TimelineLaneId,
  TimelineLaneView,
} from './timelineViewModel.types';

export const LANE_ORDER: TimelineLaneId[] = ['errors', 'graph', 'config'];

export const LANE_LABELS: Record<TimelineLaneId, string> = {
  errors: 'Errors',
  graph: 'Graph',
  config: 'Config',
};

/** pid-reconfig and args-change are both per-filter config changes, not topology. */
export const EVENT_TYPE_TO_LANE: Record<TimelineEventType, TimelineLaneId> = {
  error: 'errors',
  warning: 'errors',
  'graph-change': 'graph',
  'pid-reconfig': 'config',
  'args-change': 'config',
};

export const CLUSTER_MIN_GAP_PERCENT = 2;

export function buildLanes(
  viewport: TimelineViewport,
  events: TimelineEvent[],
): TimelineLaneView[] {
  const visibleEvents = getVisibleEvents(viewport, events);
  return LANE_ORDER.map((laneId) => {
    const laneVisibleEvents = visibleEvents.filter(
      (positioned) => EVENT_TYPE_TO_LANE[positioned.event.type] === laneId,
    );
    return {
      id: laneId,
      label: LANE_LABELS[laneId],
      items: clusterVisibleEvents(laneVisibleEvents, CLUSTER_MIN_GAP_PERCENT),
    };
  });
}
