import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { setUIFilter, LogsUIFilter } from '@/shared/store/slices/logsSlice';
import { addWidget } from '@/shared/store/slices/widgetsSlice';
import { selectActiveWidgets } from '@/shared/store/selectors/widgets';
import { WidgetType } from '@/types/ui/widget';

/**
 * Hook to open the LogsMonitor widget with a specific UI filter.
 * Centralizes the logic: setUIFilter + open widget if not already open.
 */
export function useOpenLogsWidget() {
  const dispatch = useAppDispatch();
  const activeWidgets = useAppSelector(selectActiveWidgets);

  const logsWidgetAlreadyOpen = activeWidgets.some(
    (w) => w.type === WidgetType.LOGS,
  );

  return useCallback(
    (uiFilter: LogsUIFilter) => {
      dispatch(setUIFilter(uiFilter));
      if (!logsWidgetAlreadyOpen) {
        dispatch(addWidget(WidgetType.LOGS));
      }
    },
    [dispatch, logsWidgetAlreadyOpen],
  );
}
