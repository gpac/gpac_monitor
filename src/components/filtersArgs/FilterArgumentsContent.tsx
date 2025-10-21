import React, { useMemo, useCallback } from 'react';
import {
  updateFilterArgument,
  makeSelectArgumentUpdatesForFilter,
} from '@/shared/store/slices/filterArgumentSlice';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import ArgumentItem from './arguments/ArgumentItem';

interface FilterArgumentsContentProps {
  filterId: number;
  filterArgs: any[];
  showExpert?: boolean;
  showAdvanced?: boolean;
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
    (argName: string, newValue: any) => {
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

  return (
    <div className="divide-y divide-monitor-divider bg-monitor-paneloverflow-y-auto">
      {visibleArgs.map((arg) => (
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
