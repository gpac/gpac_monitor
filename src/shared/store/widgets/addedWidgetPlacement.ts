import { Layout } from 'react-grid-layout';
import { Widget } from '@/types/ui/widget';
import { findFirstFreeSlot } from '@/utils/layout/firstFreeSlot';
import { GRID_COLUMNS } from './detachedPlacement';
import { WidgetsState } from './types';

export const toLayoutItem = ({ id, x, y, w, h }: Widget): Layout => ({
  i: id,
  x,
  y,
  w,
  h,
});

export const placeAddedWidget = (state: WidgetsState, widget: Widget) => {
  const { x, y, compactedLayout } = findFirstFreeSlot(
    state.activeWidgets.map(toLayoutItem),
    widget.w,
    widget.h,
    GRID_COLUMNS,
  );

  state.activeWidgets.forEach((activeWidget, index) => {
    activeWidget.y = compactedLayout[index].y;
  });

  widget.x = x;
  widget.y = y;
};
