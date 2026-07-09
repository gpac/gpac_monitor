import type {
  TimelineEvent,
  TimelineEventType,
} from '@/services/historyService/types';
import type { TimelineViewport } from '@/utils/history/timelineViewport';
import type { TimeSegment } from '@/utils/history/mapManifestToSegments';
import {
  clusterVisibleEvents,
  getVisibleEvents,
  toPercent,
} from '@/utils/history/timelineViewportView';
import type {
  TimelineLaneId,
  TimelineLaneView,
  PositionedChunkSegment,
  OverviewBin,
  SelectedEventDetail,
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
export const DEFAULT_OVERVIEW_BIN_COUNT = 60;

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

function isSegmentVisible(
  segment: TimeSegment,
  viewport: TimelineViewport,
): boolean {
  const visibleEndUs = viewport.visibleStartUs + viewport.visibleDurationUs;
  return (
    segment.toUs >= viewport.visibleStartUs && segment.fromUs <= visibleEndUs
  );
}

function getSegmentWidthPercent(
  segment: TimeSegment,
  viewport: TimelineViewport,
): number {
  return ((segment.toUs - segment.fromUs) / viewport.visibleDurationUs) * 100;
}

export function buildChunkSegments(
  viewport: TimelineViewport,
  segments: TimeSegment[],
): PositionedChunkSegment[] {
  return segments
    .map((segment, index) => ({ segment, index }))
    .filter(({ segment }) => isSegmentVisible(segment, viewport))
    .map(({ segment, index }) => ({
      index,
      fromUs: segment.fromUs,
      toUs: segment.toUs,
      positionPercent: toPercent(segment.fromUs, viewport),
      widthPercent: getSegmentWidthPercent(segment, viewport),
    }));
}

function clampIndex(index: number, maxIndex: number): number {
  return Math.min(maxIndex, Math.max(0, index));
}

export function buildOverviewBins(
  sessionDurationUs: number,
  events: TimelineEvent[],
  binCount: number,
): OverviewBin[] {
  if (sessionDurationUs <= 0 || binCount <= 0) return [];
  const binDurationUs = sessionDurationUs / binCount;
  const eventCountsByBin = new Array<number>(binCount).fill(0);
  for (const event of events) {
    const binIndex = clampIndex(
      Math.floor(event.sessionTimeUs / binDurationUs),
      binCount - 1,
    );
    eventCountsByBin[binIndex] += 1;
  }
  return eventCountsByBin.map((count, index) => ({
    positionPercent: ((index + 0.5) / binCount) * 100,
    count,
  }));
}

export function buildSelectedEventDetail(
  events: TimelineEvent[],
  selectedEventId: string | null | undefined,
): SelectedEventDetail | null {
  if (!selectedEventId) return null;
  const event = events.find((candidate) => candidate.id === selectedEventId);
  if (!event) return null;
  return {
    id: event.id,
    type: event.type,
    sessionTimeUs: event.sessionTimeUs,
    title: event.title,
  };
}
