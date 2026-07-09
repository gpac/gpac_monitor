import type {
  TimelineEvent,
  TimelineEventType,
} from '@/services/historyService/types';
import type { TimeRuler } from '@/utils/history/generateTimeTicks';
import type { TimelineViewport } from '@/utils/history/timelineViewport';
import type { TimeSegment } from '@/utils/history/mapManifestToSegments';
import type { TimelineItem } from '@/utils/history/timelineViewportView';

export type TimelineLaneId = 'errors' | 'graph' | 'config';

export interface TimelineLaneView {
  id: TimelineLaneId;
  label: string;
  items: TimelineItem[];
}

export interface PositionedChunkSegment {
  index: number;
  fromUs: number;
  toUs: number;
  positionPercent: number;
  widthPercent: number;
}

export interface TimelinePlayhead {
  positionPercent: number;
  sessionTimeUs: number;
}

export interface OverviewBin {
  positionPercent: number;
  count: number;
}

export interface SelectedEventDetail {
  id: string;
  type: TimelineEventType;
  sessionTimeUs: number;
  title: string;
}

export interface TimelineViewModelInput {
  events: TimelineEvent[];
  viewport: TimelineViewport;
  currentSessionTimeUs: number;
  chunkSegments?: TimeSegment[];
  selectedEventId?: string | null;
  overviewBinCount?: number;
}

export interface TimelineViewModel {
  rulerTicks: TimeRuler;
  lanes: TimelineLaneView[];
  chunkSegments: PositionedChunkSegment[];
  playhead: TimelinePlayhead;
  overviewBins: OverviewBin[];
  selectedEventDetail: SelectedEventDetail | null;
}
