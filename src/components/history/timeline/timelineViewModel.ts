import { generateWindowTimeTicks } from '@/utils/history/generateTimeTicks';
import type { TimelineViewport } from '@/utils/history/timelineViewport';
import { getCursorPercent } from '@/utils/history/timelineViewportView';
import { formatCompactTime } from '@/utils/formatting/time';
import {
  buildLanes,
  buildChunkSegments,
  buildOverviewBins,
  buildSelectedEventDetail,
  DEFAULT_OVERVIEW_BIN_COUNT,
} from './timelineViewModelBuilders';
import type {
  TimelineSessionView,
  TimelineSessionViewInput,
  TimelinePlayhead,
} from './timelineViewModel.types';

export type * from './timelineViewModel.types';

/** Session-derived view: lanes, chunk bands, minimap, selection. Independent of playback time. */
export function buildTimelineSessionView(
  input: TimelineSessionViewInput,
): TimelineSessionView {
  const {
    events,
    viewport,
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
    overviewBins: buildOverviewBins(
      viewport.sessionDurationUs,
      events,
      overviewBinCount,
    ),
    selectedEventDetail: buildSelectedEventDetail(events, selectedEventId),
  };
}

/** Frame-derived playhead: the only piece that should recompute on every player tick. */
export function buildTimelinePlayhead(
  viewport: TimelineViewport,
  currentSessionTimeUs: number,
): TimelinePlayhead {
  return {
    positionPercent: getCursorPercent(viewport, currentSessionTimeUs),
    sessionTimeUs: currentSessionTimeUs,
    label: formatCompactTime(currentSessionTimeUs),
  };
}
