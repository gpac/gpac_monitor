import React, { useMemo } from 'react';
import { FilterArgumentInput } from './FilterArgumentInput';
import { ArgumentDisplayValue } from './arguments/ArgumentDisplayValue';
import { cn } from '../../utils/cn';
import { Badge } from '../ui/badge';
import { Spinner } from '../ui/spinner';
import {
  updateFilterArgument,
  makeSelectArgumentUpdatesForFilter,
} from '@/shared/store/slices/filterArgumentSlice';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';

interface FilterArgumentsContentProps {
  filterId: number;
  filterArgs: any[];
}

/**
 * Simple component for filter arguments editing.
 * Updates immediately on change, shows loader during update.
 */
const FilterArgumentsContent: React.FC<FilterArgumentsContentProps> = ({
  filterId,
  filterArgs,
}) => {
  const dispatch = useAppDispatch();

  const selectArgumentUpdates = useMemo(
    () => makeSelectArgumentUpdatesForFilter(),
    [],
  );
  const argumentUpdates = useAppSelector((state) =>
    selectArgumentUpdates(state, filterId.toString(), filterArgs),
  );

  const handleValueChange = (argName: string, newValue: any) => {
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
  };

  const renderArgumentInput = (arg: any) => {
    const type = arg.type || typeof arg.value;
    const updateStatus = argumentUpdates?.[arg.name];
    const isPending = updateStatus?.status === 'pending';

    return (
      <FilterArgumentInput
        argument={{
          name: arg.name,
          type: type,
          desc: arg.desc,
          hint: arg.hint,
          default: arg.default,
          min_max_enum: arg.min_max_enum,
          update: !!arg.update,
          update_sync: !!arg.update_sync,
        }}
        value={updateStatus?.value ?? arg.value}
        onChange={(newValue) => {
          handleValueChange(arg.name, newValue);
        }}
        rules={{
          disabled: !arg.update || isPending,
          min: arg.min,
          max: arg.max,
          step: arg.step,
        }}
      />
    );
  };

  return (
    <div className="space-y-3 overflow-y-auto pr-1">
      {filterArgs.map((arg, index) => {
        const updateStatus = argumentUpdates?.[arg.name];
        const isPending = updateStatus?.status === 'pending';

        return (
          <div
            key={index}
            className={cn(
              'bg-gray-700/30 rounded p-2',
              'border border-gray-600/50',
              'transition-colors duration-200',
              'hover:bg-gray-700/50',
              arg.update ? 'border-green-500/20' : '',
              isPending ? 'opacity-60' : '',
            )}
          >
            <div className="flex flex-col gap-2">
              {/* Name + badges + loader */}
              <div className="flex items-start justify-between gap-1">
                <h4 className="text-xs font-medium text-slate-100 truncate flex-1">
                  {arg.name}
                </h4>
                <div className="flex gap-1 shrink-0 items-center">
                  {isPending && <Spinner size="sm" className="text-debug" />}
                  {arg.update && !isPending && (
                    <Badge variant="success" className="text-[8px] px-1 py-0">
                      ✓
                    </Badge>
                  )}
                </div>
              </div>

              {/* Value display */}
              <div className="text-xs font-mono px-2 py-1 rounded bg-gray-900/50 text-slate-300">
                <ArgumentDisplayValue
                  value={updateStatus?.value ?? arg.value}
                  isEditable={!!arg.update}
                />
              </div>

              {/* Input */}
              <div>{renderArgumentInput(arg)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FilterArgumentsContent;
