import { describe, it, expect } from 'vitest';
import {
  buildTimelineSessionView,
  buildTimelinePlayhead,
} from '../timelineViewModel';
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

describe('buildTimelineSessionView — lanes', () => {
  it('partitions events into errors, graph and config lanes only', () => {
    const sessionView = buildTimelineSessionView({ events, viewport });
    expect(sessionView.lanes.map((lane) => lane.id)).toEqual([
      'errors',
      'graph',
      'config',
    ]);
    const errorsLane = sessionView.lanes.find((lane) => lane.id === 'errors')!;
    expect(errorsLane.items).toHaveLength(2);
  });

  it('groups pid-reconfig and args-change under the config lane', () => {
    const sessionView = buildTimelineSessionView({ events, viewport });
    const configLane = sessionView.lanes.find((lane) => lane.id === 'config')!;
    expect(configLane.items).toHaveLength(2);
  });

  it('does not depend on playback time — same inputs always produce the same lanes', () => {
    const first = buildTimelineSessionView({ events, viewport });
    const second = buildTimelineSessionView({ events, viewport });
    expect(second.lanes).toEqual(first.lanes);
    expect(buildTimelineSessionView({ events, viewport })).not.toHaveProperty(
      'playhead',
    );
  });
});

describe('buildTimelineSessionView — chunkSegments', () => {
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
    const sessionView = buildTimelineSessionView({
      events: [],
      viewport: narrowViewport,
      chunkSegments: segments,
    });
    expect(sessionView.chunkSegments).toHaveLength(1);
    expect(sessionView.chunkSegments[0].index).toBe(1);
  });
});

describe('buildTimelineSessionView — overviewBins', () => {
  it('bins events over the full session duration, not the visible window', () => {
    const zoomedViewport: TimelineViewport = {
      sessionDurationUs: 100_000_000,
      visibleStartUs: 0,
      visibleDurationUs: 5_000_000,
    };
    const sessionView = buildTimelineSessionView({
      events,
      viewport: zoomedViewport,
      overviewBinCount: 10,
    });
    const totalCount = sessionView.overviewBins.reduce(
      (sum, bin) => sum + bin.count,
      0,
    );
    expect(totalCount).toBe(events.length);
  });
});

describe('buildTimelineSessionView — selectedEventDetail', () => {
  it('is null when no selection is provided', () => {
    const sessionView = buildTimelineSessionView({ events, viewport });
    expect(sessionView.selectedEventDetail).toBeNull();
  });

  it('is null when the selected id does not match any event', () => {
    const sessionView = buildTimelineSessionView({
      events,
      viewport,
      selectedEventId: 'missing',
    });
    expect(sessionView.selectedEventDetail).toBeNull();
  });

  it('returns the matching event fields only', () => {
    const sessionView = buildTimelineSessionView({
      events,
      viewport,
      selectedEventId: 'g1',
    });
    expect(sessionView.selectedEventDetail).toEqual({
      id: 'g1',
      type: 'graph-change',
      sessionTimeUs: 30_000_000,
      title: 'event g1',
    });
  });
});

describe('buildTimelinePlayhead', () => {
  it('clamps the playhead position to the visible window', () => {
    const model = buildTimelinePlayhead(
      { ...viewport, visibleDurationUs: 50_000_000 },
      90_000_000,
    );
    expect(model.positionPercent).toBe(100);
  });

  it('varies with currentSessionTimeUs while the session view stays identical', () => {
    const sessionView = buildTimelineSessionView({ events, viewport });
    const early = buildTimelinePlayhead(viewport, 0);
    const late = buildTimelinePlayhead(viewport, 90_000_000);
    expect(early.positionPercent).not.toBe(late.positionPercent);
    expect(buildTimelineSessionView({ events, viewport }).lanes).toEqual(
      sessionView.lanes,
    );
  });

  it('formats a compact time label', () => {
    const model = buildTimelinePlayhead(viewport, 65_000_000);
    expect(model.label).toBe('01:05');
  });
});
