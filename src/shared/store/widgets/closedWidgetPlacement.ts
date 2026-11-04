import { slideLeftOnClose } from '@/utils/layout/slideLeftOnClose';
import { toLayoutItem } from './addedWidgetPlacement';
import { GRID_COLUMNS, getStoredYBelowDetached } from './detachedPlacement';
import { WidgetsState } from './types';

export const slideWidgetsOnClose = (
  state: WidgetsState,
  closedWidgetId: string,
) => {
  const detachedWidgetIds = state.activeWidgets
    .filter((widget) => widget.isDetached)
    .map((widget) => widget.id);
  const slidLayout = slideLeftOnClose(
    state.activeWidgets.map(toLayoutItem),
    closedWidgetId,
    GRID_COLUMNS,
    detachedWidgetIds,
  );

  state.activeWidgets.forEach((widget) => {
    if (widget.isDetached) return;
    const slidItem = slidLayout.find((item) => item.i === widget.id);
    if (!slidItem) return;
    widget.x = slidItem.x;
    widget.y = getStoredYBelowDetached(state, slidLayout, slidItem.y);
  });
};
