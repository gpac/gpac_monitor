import { describe, it, expect } from 'vitest';
import { Layout } from 'react-grid-layout';
import { findFirstFreeSlot } from '../firstFreeSlot';

const COLUMNS = 24;

const left: Layout = { i: 'left', x: 0, y: 0, w: 12, h: 4 };
const right: Layout = { i: 'right', x: 18, y: 0, w: 6, h: 4 };
const below: Layout = { i: 'below', x: 0, y: 4, w: 24, h: 2 };
const layoutWithHole = [left, right, below];

describe('findFirstFreeSlot', () => {
  it('uses a hole of the exact size', () => {
    const slot = findFirstFreeSlot(layoutWithHole, 6, 4, COLUMNS);

    expect({ x: slot.x, y: slot.y }).toEqual({ x: 12, y: 0 });
  });

  it('goes to the bottom when the hole is too small', () => {
    const slot = findFirstFreeSlot(layoutWithHole, 8, 4, COLUMNS);

    expect({ x: slot.x, y: slot.y }).toEqual({ x: 0, y: 6 });
  });

  it('uses a hole larger than the widget', () => {
    const slot = findFirstFreeSlot(layoutWithHole, 4, 2, COLUMNS);

    expect({ x: slot.x, y: slot.y }).toEqual({ x: 12, y: 0 });
  });

  it('starts at the top left of an empty grid', () => {
    const slot = findFirstFreeSlot([], 12, 4, COLUMNS);

    expect({ x: slot.x, y: slot.y }).toEqual({ x: 0, y: 0 });
  });

  it('prefers a higher row over a position further left', () => {
    const top: Layout = { i: 'top', x: 0, y: 0, w: 18, h: 2 };
    const second: Layout = { i: 'second', x: 0, y: 2, w: 12, h: 2 };

    const slot = findFirstFreeSlot([top, second], 6, 2, COLUMNS);

    expect({ x: slot.x, y: slot.y }).toEqual({ x: 18, y: 0 });
  });

  it('sees no false hole above a widget stored lower than displayed', () => {
    const storedLow: Layout = { i: 'storedLow', x: 0, y: 8, w: 24, h: 4 };

    const slot = findFirstFreeSlot([storedLow], 24, 2, COLUMNS);

    expect({ x: slot.x, y: slot.y }).toEqual({ x: 0, y: 4 });
    expect(slot.compactedLayout[0].y).toBe(0);
  });
});
