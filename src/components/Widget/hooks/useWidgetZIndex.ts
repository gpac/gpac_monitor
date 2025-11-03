import { useCallback, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/shared/hooks/redux';
import { setWidgetZIndex } from '@/shared/store/slices/widgetsSlice';

/**
 * Hook to manage widget z-index for bring-to-front functionality
 * When a widget is clicked, it gets the highest z-index + 1
 */
export function useWidgetZIndex(widgetId: string) {
  const dispatch = useAppDispatch();

  // Get current widget
  const widget = useAppSelector((state) =>
    state.widgets.activeWidgets.find((w) => w.id === widgetId),
  );

  // Calculate max z-index from all widgets
  const allWidgets = useAppSelector((state) => state.widgets.activeWidgets);
  const maxZIndex = useMemo(() => {
    return Math.max(0, ...allWidgets.map((w) => w.zIndex || 0));
  }, [allWidgets]);

  // Bring widget to front
  const bringToFront = useCallback(() => {
    const currentZIndex = widget?.zIndex || 0;
    // Only update if not already at front
    if (currentZIndex < maxZIndex) {
      dispatch(setWidgetZIndex({ id: widgetId, zIndex: maxZIndex + 1 }));
    }
  }, [dispatch, widgetId, widget?.zIndex, maxZIndex]);

  return {
    currentZIndex: widget?.zIndex || 0,
    maxZIndex,
    bringToFront,
    isAtFront: (widget?.zIndex || 0) >= maxZIndex,
  };
}
