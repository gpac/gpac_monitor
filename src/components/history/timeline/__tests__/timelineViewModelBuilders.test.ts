import { describe, it, expect } from 'vitest';
import { buildLanes } from '../timelineViewModelBuilders';
import type { TimelineViewport } from '@/utils/history/timelineViewport';
import type {
  TimelineEvent,
  TimelineEventType,
} from '@/services/historyService/types';

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

describe('buildLanes', () => {
  it('partitions events into errors, graph and config lanes only', () => {
    const lanes = buildLanes(viewport, events);
    expect(lanes.map((lane) => lane.id)).toEqual(['errors', 'graph', 'config']);
    const errorsLane = lanes.find((lane) => lane.id === 'errors')!;
    expect(errorsLane.items).toHaveLength(2);
  });

  it('groups pid-reconfig and args-change under the config lane', () => {
    const lanes = buildLanes(viewport, events);
    const configLane = lanes.find((lane) => lane.id === 'config')!;
    expect(configLane.items).toHaveLength(2);
  });

  it('excludes events outside the visible window', () => {
    const zoomedViewport: TimelineViewport = {
      sessionDurationUs: 100_000_000,
      visibleStartUs: 0,
      visibleDurationUs: 20_000_000,
    };
    const lanes = buildLanes(zoomedViewport, events);
    const graphLane = lanes.find((lane) => lane.id === 'graph')!;
    expect(graphLane.items).toHaveLength(0);
  });
});
