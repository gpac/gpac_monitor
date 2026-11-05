import { describe, it, expect } from 'vitest';
import { Layout } from 'react-grid-layout';
import { slideLeftOnClose } from '../slideLeftOnClose';

const COLUMNS = 24;

const branchLayout: Layout[] = [
  { i: 'graph', x: 0, y: 0, w: 13, h: 8 },
  { i: 'filters', x: 13, y: 0, w: 11, h: 8 },
  { i: 'metrics', x: 0, y: 8, w: 6, h: 4 },
  { i: 'logs', x: 6, y: 8, w: 18, h: 4 },
];

const monitorLayout: Layout[] = [
  { i: 'metrics', x: 0, y: 0, w: 6, h: 6 },
  { i: 'filters', x: 6, y: 0, w: 18, h: 6 },
  { i: 'graph', x: 0, y: 6, w: 16, h: 6 },
  { i: 'logs', x: 16, y: 6, w: 8, h: 6 },
];

const positionOf = (layout: Layout[], itemId: string) => {
  const item = layout.find((candidate) => candidate.i === itemId);
  return item && { x: item.x, y: item.y, w: item.w };
};

describe('slideLeftOnClose', () => {
  it('slides logs left when metrics closes on the branch layout', () => {
    const result = slideLeftOnClose(branchLayout, 'metrics', COLUMNS);

    expect(positionOf(result, 'metrics')).toBeUndefined();
    expect(positionOf(result, 'logs')).toEqual({ x: 0, y: 8, w: 18 });
    expect(positionOf(result, 'filters')).toEqual({ x: 13, y: 0, w: 11 });
  });

  it('slides filters left and keeps the bottom row when graph closes', () => {
    const result = slideLeftOnClose(branchLayout, 'graph', COLUMNS);

    expect(positionOf(result, 'filters')).toEqual({ x: 0, y: 0, w: 11 });
    expect(positionOf(result, 'metrics')).toEqual({ x: 0, y: 8, w: 6 });
    expect(positionOf(result, 'logs')).toEqual({ x: 6, y: 8, w: 18 });
  });

  it('slides filters left when metrics closes on the monitor layout', () => {
    const result = slideLeftOnClose(monitorLayout, 'metrics', COLUMNS);

    expect(positionOf(result, 'filters')).toEqual({ x: 0, y: 0, w: 18 });
    expect(positionOf(result, 'graph')).toEqual({ x: 0, y: 6, w: 16 });
    expect(positionOf(result, 'logs')).toEqual({ x: 16, y: 6, w: 8 });
  });

  it('slides logs left when graph closes on the monitor layout', () => {
    const result = slideLeftOnClose(monitorLayout, 'graph', COLUMNS);

    expect(positionOf(result, 'logs')).toEqual({ x: 0, y: 6, w: 8 });
    expect(positionOf(result, 'filters')).toEqual({ x: 6, y: 0, w: 18 });
  });

  it('slides a widget that rises into the freed rows', () => {
    const result = slideLeftOnClose(monitorLayout, 'filters', COLUMNS);

    expect(positionOf(result, 'logs')).toEqual({ x: 6, y: 0, w: 8 });
    expect(positionOf(result, 'graph')).toEqual({ x: 0, y: 6, w: 16 });
  });

  it('moves nothing when no widget is on the right', () => {
    const result = slideLeftOnClose(branchLayout, 'logs', COLUMNS);

    expect(positionOf(result, 'metrics')).toEqual({ x: 0, y: 8, w: 6 });
    expect(positionOf(result, 'filters')).toEqual({ x: 13, y: 0, w: 11 });
  });

  it('stops a tall widget at an obstacle on its lower rows', () => {
    const layout: Layout[] = [
      { i: 'closed', x: 0, y: 0, w: 6, h: 2 },
      { i: 'obstacle', x: 0, y: 2, w: 6, h: 2 },
      { i: 'tall', x: 6, y: 0, w: 6, h: 4 },
    ];

    const result = slideLeftOnClose(layout, 'closed', COLUMNS);

    expect(positionOf(result, 'tall')).toEqual({ x: 6, y: 0, w: 6 });
    expect(positionOf(result, 'obstacle')).toEqual({ x: 0, y: 0, w: 6 });
  });

  it('reads rows from compacted positions, not stored ones', () => {
    const layout: Layout[] = [
      { i: 'graph', x: 0, y: 0, w: 13, h: 8 },
      { i: 'filters', x: 13, y: 0, w: 11, h: 8 },
      { i: 'metrics', x: 0, y: 20, w: 6, h: 4 },
      { i: 'logs', x: 6, y: 30, w: 18, h: 4 },
    ];

    const result = slideLeftOnClose(layout, 'metrics', COLUMNS);

    expect(positionOf(result, 'logs')).toEqual({ x: 0, y: 8, w: 18 });
  });

  it('never slides a fixed widget, which still acts as an obstacle', () => {
    const layout: Layout[] = [
      { i: 'closed', x: 0, y: 0, w: 6, h: 4 },
      { i: 'detached', x: 8, y: 10, w: 8, h: 6 },
      { i: 'free', x: 16, y: 0, w: 8, h: 4 },
    ];

    const result = slideLeftOnClose(layout, 'closed', COLUMNS, ['detached']);

    expect(positionOf(result, 'detached')).toEqual({ x: 8, y: 0, w: 8 });
    expect(positionOf(result, 'free')).toEqual({ x: 16, y: 0, w: 8 });
  });

  it('returns the compacted layout when the closed widget is unknown', () => {
    const result = slideLeftOnClose(branchLayout, 'unknown', COLUMNS);

    expect(result).toHaveLength(branchLayout.length);
    expect(positionOf(result, 'logs')).toEqual({ x: 6, y: 8, w: 18 });
  });
});
