import React, { useMemo } from 'react';
import { FilterArgumentInput } from './FilterArgumentInput';
import { cn } from '../../utils/cn';
import { Badge } from '../ui/badge';
import { Spinner } from '../ui/spinner';
import { FaCircleInfo } from 'react-icons/fa6';
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import {
  updateFilterArgument,
  makeSelectArgumentUpdatesForFilter,
} from '@/shared/store/slices/filterArgumentSlice';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { getBorderStyle } from './utils/argumentStyles';

interface FilterArgumentsContentProps {
  filterId: number;
  filterArgs: any[];
  showExpert?: boolean;
  showAdvanced?: boolean;
}

/**
 *
 * Updates immediately on change, shows loader during update.
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

  // Filter arguments based on hint level
  const visibleArgs = filterArgs.filter((arg) => {
    const hint = arg.hint?.toLowerCase();
    if (hint === 'expert' && !showExpert) return false;
    if (hint === 'advanced' && !showAdvanced) return false;
    return true;
  });

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
        isPending={isPending}
      />
    );
  };

  return (
    <div className="divide-y divide-gray-500/50 overflow-y-auto ">
      {visibleArgs.map((arg, index) => {
        const updateStatus = argumentUpdates?.[arg.name];
        const isPending = updateStatus?.status === 'pending';
        const isUpdatable = !!arg.update;

        return (
          <div
            key={index}
            className={cn(
              'py-2 px-3 transition-colors duration-150',
              'hover:bg-gray-800/30',
              getBorderStyle(arg.hint),
              isPending && 'opacity-60',
            )}
          >
            {/* Header: Name + Info + Status */}
            <div className="flex items-center gap-2 mb-2">
              <h4
                className={cn(
                  'text-xs font-medium truncate flex-1',
                  isUpdatable ? 'text-info' : 'text-slate-300',
                )}
              >
                {arg.name}
              </h4>

              {/* Info icon with tooltip */}
              {arg.desc && (
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <FaCircleInfo
                          className={cn(
                            'w-3 h-3 cursor-pointer transition-colors',
                            isUpdatable
                              ? 'text-slate-300 hover:text-slate-200'
                              : 'text-gray-500 hover:text-gray-400',
                          )}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="left"
                      sideOffset={8}
                      className="max-w-xs z-[100] rounded bg-gray-900 px-2 py-1 text-[10px] text-gray-200 border border-gray-700"
                    >
                      <p>{arg.desc}</p>
                      <TooltipArrow className="fill-gray-900" />
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Status indicators */}
              <div className="flex gap-1 shrink-0 items-center">
                {isPending && <Spinner size="sm" className="text-blue-400" />}
                {isUpdatable && !isPending && (
                  <Badge
                    variant="success"
                    className="text-[8px] px-1.5 py-0 h-4"
                  >
                    ✓
                  </Badge>
                )}
              </div>
            </div>

            {/* Input only - no duplicate value display */}
            <div className="text-xs">{renderArgumentInput(arg)}</div>
          </div>
        );
      })}
    </div>
  );
};

export default FilterArgumentsContent;
