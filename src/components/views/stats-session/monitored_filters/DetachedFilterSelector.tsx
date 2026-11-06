import { memo } from 'react';
import { LuChevronDown } from 'react-icons/lu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { selectAllDetachedWidgets } from '@/shared/store/selectors/widgets/detachedWidgetSelectors';
import { replaceDetachedFilter } from '@/shared/store/widgets/widgetsSlice';

interface DetachedFilterSelectorProps {
  widgetId: string;
  filterIdx: number;
}

export const DetachedFilterSelector = memo(
  ({ widgetId, filterIdx }: DetachedFilterSelectorProps) => {
    const dispatch = useAppDispatch();
    const filters = useAppSelector((state) => state.graph.filters);
    const detachedWidgets = useAppSelector(selectAllDetachedWidgets);
    const currentFilter = filters.find((filter) => filter.idx === filterIdx);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="no-drag flex items-center gap-2 rounded px-1 hover:bg-gray-600 focus-visible:outline focus-visible:outline-2"
            aria-label="Change detached filter"
          >
            {currentFilter?.name ?? `Filter ${filterIdx}`}
            <LuChevronDown className="h-4 w-4" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="no-drag max-h-80 overflow-y-auto"
        >
          {filters.map((filter) => {
            const isCurrent = filter.idx === filterIdx;
            const isDetachedElsewhere = detachedWidgets.some(
              (widget) =>
                widget.id !== widgetId &&
                widget.detachedFilterIdx === filter.idx,
            );
            return (
              <DropdownMenuItem
                key={filter.idx}
                disabled={isCurrent || isDetachedElsewhere}
                onSelect={() =>
                  dispatch(
                    replaceDetachedFilter({
                      widgetId,
                      filterIdx: filter.idx,
                      name: filter.name,
                    }),
                  )
                }
              >
                <span>{filter.name}</span>
                <span className="ml-3 text-xs text-monitor-text-muted">
                  #{filter.idx}
                  {isCurrent ? ' · Current' : ''}
                  {isDetachedElsewhere ? ' · Detached elsewhere' : ''}
                </span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
);

DetachedFilterSelector.displayName = 'DetachedFilterSelector';
