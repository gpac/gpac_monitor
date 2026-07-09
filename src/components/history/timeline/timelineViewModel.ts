import type {
  TimelineEvent,
  TimelineEventType,
} from '@/services/historyService/types';
import { generateWindowTimeTicks } from '@/utils/history/generateTimeTicks';
import type { TimelineViewport } from '@/utils/history/timelineViewport';
import type { TimeSegment } from '@/utils/history/mapManifestToSegments';
import {
  clusterVisibleEvents,
  getCursorPercent,
  getVisibleEvents,
  toPercent,
} from '@/utils/history/timelineViewportView';
import type {
  TimelineLaneId,
  TimelineLaneView,
  TimelineViewModel,
  TimelineViewModelInput,
  PositionedChunkSegment,
  OverviewBin,
  SelectedEventDetail,
} from './timelineViewModel.types';

export type * from './timelineViewModel.types';

const LANE_ORDER: TimelineLaneId[] = ['errors', 'graph', 'config'];

const LANE_LABELS: Record<TimelineLaneId, string> = {
  errors: 'Errors',
  graph: 'Graph',
  config: 'Config',
};

/** pid-reconfig and args-change are both per-filter config changes, not topology. */
const EVENT_TYPE_TO_LANE: Record<TimelineEventType, TimelineLaneId> = {
  error: 'errors',
  warning: 'errors',
  'graph-change': 'graph',
  'pid-reconfig': 'config',
  'args-change': 'config',
};

const CLUSTER_MIN_GAP_PERCENT = 2;
const DEFAULT_OVERVIEW_BIN_COUNT = 60;

function buildLanes(
  viewport: TimelineViewport,
  events: TimelineEvent[],
): TimelineLaneView[] {
  const visible = getVisibleEvents(viewport, events);
  return LANE_ORDER.map((laneId) => {
    const laneVisible = visible.filter(
      (positioned) => EVENT_TYPE_TO_LANE[positioned.event.type] === laneId,
    );
    return {
      id: laneId,
      label: LANE_LABELS[laneId],
      items: clusterVisibleEvents(laneVisible, CLUSTER_MIN_GAP_PERCENT),
    };
  });
}

function buildChunkSegments(
  viewport: TimelineViewport,
  segments: TimeSegment[],
): PositionedChunkSegment[] {
  const visibleEndUs = viewport.visibleStartUs + viewport.visibleDurationUs;
  return segments
    .map((segment, index) => ({ segment, index }))
    .filter(
      ({ segment }) =>
        segment.toUs >= viewport.visibleStartUs &&
        segment.fromUs <= visibleEndUs,
    )
    .map(({ segment, index }) => ({
      index,
      fromUs: segment.fromUs,
      toUs: segment.toUs,
      positionPercent: toPercent(segment.fromUs, viewport),
      widthPercent:
        ((segment.toUs - segment.fromUs) / viewport.visibleDurationUs) * 100,
    }));
}

function buildOverviewBins(
  sessionDurationUs: number,
  events: TimelineEvent[],
  binCount: number,
): OverviewBin[] {
  if (sessionDurationUs <= 0 || binCount <= 0) return [];
  const binDurationUs = sessionDurationUs / binCount;
  const counts = new Array<number>(binCount).fill(0);
  for (const event of events) {
    const binIndex = Math.min(
      binCount - 1,
      Math.max(0, Math.floor(event.sessionTimeUs / binDurationUs)),
    );
    counts[binIndex] += 1;
  }
  return counts.map((count, index) => ({
    positionPercent: ((index + 0.5) / binCount) * 100,
    count,
  }));
}

function buildSelectedEventDetail(
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

export function buildTimelineViewModel(
  input: TimelineViewModelInput,
): TimelineViewModel {
  const {
    events,
    viewport,
    currentSessionTimeUs,
    chunkSegments = [],
    selectedEventId = null,
    overviewBinCount = DEFAULT_OVERVIEW_BIN_COUNT,
  } = input;

  return {
    rulerTicks: generateWindowTimeTicks(
      viewport.visibleStartUs,
      viewport.visibleDurationUs,
    ),
    lanes: buildLanes(viewport, events),
    chunkSegments: buildChunkSegments(viewport, chunkSegments),
    playhead: {
      positionPercent: getCursorPercent(viewport, currentSessionTimeUs),
      sessionTimeUs: currentSessionTimeUs,
    },
    overviewBins: buildOverviewBins(
      viewport.sessionDurationUs,
      events,
      overviewBinCount,
    ),
    selectedEventDetail: buildSelectedEventDetail(events, selectedEventId),
  };
}
