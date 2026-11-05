import { slideLeftOnClose } from '@/utils/layout/slideLeftOnClose';
import { toLayoutItem } from './addedWidgetPlacement';
import { GRID_COLUMNS } from './detachedPlacement';
import { WidgetsState } from './types';

export const slideWidgetsOnClose = (
  state: WidgetsState,
  closedWidgetId: string,
) => {
  const slidLayout = slideLeftOnClose(
    state.activeWidgets.map(toLayoutItem),
    closedWidgetId,
    GRID_COLUMNS,
  );

  state.activeWidgets.forEach((widget) => {
    const slidItem = slidLayout.find((item) => item.i === widget.id);
    if (!slidItem) return;
    widget.x = slidItem.x;
    widget.y = slidItem.y;
  });
};
