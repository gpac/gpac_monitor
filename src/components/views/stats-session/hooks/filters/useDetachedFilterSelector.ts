import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { selectAllDetachedWidgets } from '@/shared/store/selectors/widgets/detachedWidgetSelectors';
import { replaceDetachedFilter } from '@/shared/store/widgets/widgetsSlice';

export interface DetachedFilterOption {
  idx: number;
  name: string;
  isCurrent: boolean;
  isDetachedElsewhere: boolean;
}

export const useDetachedFilterSelector = (
  widgetId: string,
  filterIdx: number,
) => {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.graph.filters);
  const detachedWidgets = useAppSelector(selectAllDetachedWidgets);

  const currentName =
    filters.find((filter) => filter.idx === filterIdx)?.name ??
    `Filter ${filterIdx}`;

  const options: DetachedFilterOption[] = filters.map((filter) => ({
    idx: filter.idx,
    name: filter.name,
    isCurrent: filter.idx === filterIdx,
    isDetachedElsewhere: detachedWidgets.some(
      (widget) =>
        widget.id !== widgetId && widget.detachedFilterIdx === filter.idx,
    ),
  }));

  const selectFilter = useCallback(
    (option: DetachedFilterOption) => {
      dispatch(
        replaceDetachedFilter({
          widgetId,
          filterIdx: option.idx,
          name: option.name,
        }),
      );
    },
    [dispatch, widgetId],
  );

  return { currentName, options, selectFilter };
};
