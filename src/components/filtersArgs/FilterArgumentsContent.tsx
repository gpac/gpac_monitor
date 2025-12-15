import React, { useMemo, useCallback } from 'react';
import {
  updateFilterArgument,
  makeSelectArgumentUpdatesForFilter,
} from '@/shared/store/slices/filterArgumentSlice';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { useSearchFilter } from '@/shared/hooks/useSearchFilter';
import ArgumentItem from './arguments/ArgumentItem';
import { GpacArgument, GPACTypes } from './types';

type GPACValue = GPACTypes[keyof GPACTypes] | null;

interface FilterArgumentsContentProps {
  filterId: number;
  filterArgs: GpacArgument[];
  showExpert?: boolean;
  showAdvanced?: boolean;
  searchQuery?: string;
}

/**
 * Optimized filter arguments display with expert/advanced filtering
 * - Uses memoization to prevent unnecessary re-renders
 * - Extracts ArgumentItem for better performance
 */
const FilterArgumentsContent: React.FC<FilterArgumentsContentProps> = ({
  filterId,
  filterArgs,
  showExpert = false,
  showAdvanced = false,
  searchQuery = '',
}) => {
  const dispatch = useAppDispatch();

  const selectArgumentUpdates = useMemo(
    () => makeSelectArgumentUpdatesForFilter(),
    [],
  );
  const argumentUpdates = useAppSelector((state) =>
    selectArgumentUpdates(state, filterId.toString(), filterArgs),
  );

  const handleValueChange = useCallback(
    (argName: string, newValue: GPACValue) => {
      const arg = filterArgs.find((a) => a.name === argName);

      if (arg?.update) {
        dispatch(
          updateFilterArgument({
            filterId: filterId.toString(),
            argName: argName,
            argValue: newValue,
          }),
        );
      }
    },
    [dispatch, filterId, filterArgs],
  );

  // Memoized filtering based on hint level
  const visibleArgs = useMemo(() => {
    return filterArgs.filter((arg) => {
      const hint = arg.hint?.toLowerCase();
      if (hint === 'expert' && !showExpert) return false;
      if (hint === 'advanced' && !showAdvanced) return false;
      return true;
    });
  }, [filterArgs, showExpert, showAdvanced]);

  // Search filtering
  const filteredArgs = useSearchFilter(
    visibleArgs,
    searchQuery,
    useCallback((arg: GpacArgument) => [arg.name, arg.desc || ''], []),
  );

  if (filteredArgs.length === 0 && searchQuery) {
    return (
      <div className="text-center text-monitor-text-muted py-6 text-xs">
        No arguments match your search.
      </div>
    );
  }

  return (
    <div className="divide-y divide-monitor-divider bg-monitor-paneloverflow-y-auto">
      {filteredArgs.map((arg) => (
        <ArgumentItem
          key={arg.name}
          arg={arg}
          updateStatus={argumentUpdates?.[arg.name]}
          onValueChange={handleValueChange}
        />
      ))}
    </div>
  );
};

export default FilterArgumentsContent;
