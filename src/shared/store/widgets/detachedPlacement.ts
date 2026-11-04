import { WidgetsState } from './types';

export const GRID_COLUMNS = 24;
const DETACHED_WIDTH = 8;
const DETACHED_HEIGHT = 6;
const DETACHED_PER_ROW = Math.floor(GRID_COLUMNS / DETACHED_WIDTH);

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

export const getFreeDetachedPlacement = (state: WidgetsState) => {
  const gridBottom = getGridBottom(state);
  const detachedWidgets = getDetachedWidgets(state);
  const isSlotTaken = (slot: number) => {
    const placement = getSlotPlacement(slot, gridBottom);
    return detachedWidgets.some(
      (detached) => detached.x === placement.x && detached.y === placement.y,
    );
  };

  let freeSlot = 0;
  while (isSlotTaken(freeSlot)) freeSlot++;

  return getSlotPlacement(freeSlot, gridBottom);
};

export const reflowDetachedWidgets = (state: WidgetsState) => {
  const gridBottom = getGridBottom(state);

  getDetachedWidgets(state)
    .sort((first, second) => first.y - second.y || first.x - second.x)
    .forEach((widget, slot) => {
      Object.assign(widget, getSlotPlacement(slot, gridBottom));
    });
};
