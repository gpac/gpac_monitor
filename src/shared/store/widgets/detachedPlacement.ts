import { Layout } from 'react-grid-layout';
import { WidgetsState } from './types';

export const GRID_COLUMNS = 24;
const DETACHED_WIDTH = 8;
const DETACHED_HEIGHT = 6;
const DETACHED_PER_ROW = Math.floor(GRID_COLUMNS / DETACHED_WIDTH);
export const DETACHED_SIZE = { w: DETACHED_WIDTH, h: DETACHED_HEIGHT };

const getGridBottom = (state: WidgetsState) =>
  state.activeWidgets
    .filter((widget) => !widget.isDetached)
    .reduce((bottom, widget) => Math.max(bottom, widget.y + widget.h), 0);

const getDetachedWidgets = (state: WidgetsState) =>
  state.activeWidgets.filter((widget) => widget.isDetached);

const getSlotPlacement = (slot: number, gridBottom: number) => ({
  x: (slot % DETACHED_PER_ROW) * DETACHED_WIDTH,
  y: gridBottom + Math.floor(slot / DETACHED_PER_ROW) * (DETACHED_HEIGHT + 1),
  w: DETACHED_WIDTH,
  h: DETACHED_HEIGHT,
});

export const getStoredYBelowDetached = (
  state: WidgetsState,
  compactedLayout: Layout[],
  displayedY: number,
): number =>
  getDetachedWidgets(state).reduce((storedY, detached) => {
    const item = compactedLayout.find(
      (candidate) => candidate.i === detached.id,
    );
    return item && item.y + item.h <= displayedY
      ? Math.max(storedY, detached.y + 1)
      : storedY;
  }, displayedY);

export const reflowDetachedWidgets = (state: WidgetsState) => {
  const gridBottom = getGridBottom(state);

  getDetachedWidgets(state)
    .sort((first, second) => first.y - second.y || first.x - second.x)
    .forEach((widget, slot) => {
      Object.assign(widget, getSlotPlacement(slot, gridBottom));
    });
};
