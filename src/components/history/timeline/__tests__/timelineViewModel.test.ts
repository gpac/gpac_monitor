import { describe, it, expect } from 'vitest';
import { buildTimelineViewModel } from '../timelineViewModel';
import type { TimelineViewport } from '@/utils/history/timelineViewport';
import type {
  TimelineEvent,
  TimelineEventType,
} from '@/services/historyService/types';
import type { TimeSegment } from '@/utils/history/mapManifestToSegments';

const viewport: TimelineViewport = {
  sessionDurationUs: 100_000_000,
  visibleStartUs: 0,
  visibleDurationUs: 100_000_000,
};

const event = (
  id: string,
  sessionTimeUs: number,
  type: TimelineEventType,
): TimelineEvent => ({ id, sessionTimeUs, type, title: `event ${id}` });

const events: TimelineEvent[] = [
  event('e1', 10_000_000, 'error'),
  event('w1', 12_000_000, 'warning'),
  event('g1', 30_000_000, 'graph-change'),
  event('p1', 50_000_000, 'pid-reconfig'),
  event('a1', 52_000_000, 'args-change'),
];

describe('buildTimelineViewModel — lanes', () => {
  it('partitions events into errors, graph and config lanes only', () => {
    const model = buildTimelineViewModel({
      events,
      viewport,
      currentSessionTimeUs: 0,
    });
    expect(model.lanes.map((lane) => lane.id)).toEqual([
      'errors',
      'graph',
      'config',
    ]);
    const errorsLane = model.lanes.find((lane) => lane.id === 'errors')!;
    expect(errorsLane.items).toHaveLength(2);
  });

  it('groups pid-reconfig and args-change under the config lane', () => {
    const model = buildTimelineViewModel({
      events,
      viewport,
      currentSessionTimeUs: 0,
    });
    const configLane = model.lanes.find((lane) => lane.id === 'config')!;
    expect(configLane.items).toHaveLength(2);
  });
});

describe('buildTimelineViewModel — chunkSegments', () => {
  const segments: TimeSegment[] = [
    { fromUs: 0, toUs: 10_000_000 },
    { fromUs: 10_000_000, toUs: 20_000_000 },
  ];

  it('positions segments and filters out ones fully outside the visible window', () => {
    const narrowViewport: TimelineViewport = {
      sessionDurationUs: 100_000_000,
      visibleStartUs: 15_000_000,
      visibleDurationUs: 10_000_000,
    };
    const model = buildTimelineViewModel({
      events: [],
      viewport: narrowViewport,
      currentSessionTimeUs: 0,
      chunkSegments: segments,
    });
    expect(model.chunkSegments).toHaveLength(1);
    expect(model.chunkSegments[0].index).toBe(1);
  });
});

describe('buildTimelineViewModel — overviewBins', () => {
  it('bins events over the full session duration, not the visible window', () => {
    const zoomedViewport: TimelineViewport = {
      sessionDurationUs: 100_000_000,
      visibleStartUs: 0,
      visibleDurationUs: 5_000_000,
    };
    const model = buildTimelineViewModel({
      events,
      viewport: zoomedViewport,
      currentSessionTimeUs: 0,
      overviewBinCount: 10,
    });
    const totalCount = model.overviewBins.reduce(
      (sum, bin) => sum + bin.count,
      0,
    );
    expect(totalCount).toBe(events.length);
  });
});

describe('buildTimelineViewModel — playhead', () => {
  it('clamps the playhead position to the visible window', () => {
    const model = buildTimelineViewModel({
      events: [],
      viewport: { ...viewport, visibleDurationUs: 50_000_000 },
      currentSessionTimeUs: 90_000_000,
    });
    expect(model.playhead.positionPercent).toBe(100);
  });
});

describe('buildTimelineViewModel — selectedEventDetail', () => {
  it('is null when no selection is provided', () => {
    const model = buildTimelineViewModel({
      events,
      viewport,
      currentSessionTimeUs: 0,
    });
    expect(model.selectedEventDetail).toBeNull();
  });

  it('is null when the selected id does not match any event', () => {
    const model = buildTimelineViewModel({
      events,
      viewport,
      currentSessionTimeUs: 0,
      selectedEventId: 'missing',
    });
    expect(model.selectedEventDetail).toBeNull();
  });

  it('returns the matching event fields only', () => {
    const model = buildTimelineViewModel({
      events,
      viewport,
      currentSessionTimeUs: 0,
      selectedEventId: 'g1',
    });
    expect(model.selectedEventDetail).toEqual({
      id: 'g1',
      type: 'graph-change',
      sessionTimeUs: 30_000_000,
      title: 'event g1',
    });
  });
});
