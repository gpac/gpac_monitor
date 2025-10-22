import React, { memo, useCallback } from 'react';
import { FilterArgumentInput } from '../FilterArgumentInput';
import { cn } from '@/utils/core';
import { Badge } from '../../ui/badge';
import { Spinner } from '../../ui/spinner';
import { FaCircleInfo } from 'react-icons/fa6';
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../ui/tooltip';
import { getBorderStyle } from '../utils/argumentStyles';

interface ArgumentItemProps {
  arg: any;
  updateStatus?: { status: string; value: any };
  onValueChange: (argName: string, newValue: any) => void;
}

const ArgumentItem: React.FC<ArgumentItemProps> = memo(
  ({ arg, updateStatus, onValueChange }) => {
    const type = arg.type || typeof arg.value;
    const isPending = updateStatus?.status === 'pending';
    const isUpdatable = !!arg.update;

    const handleChange = useCallback(
      (newValue: any) => {
        onValueChange(arg.name, newValue);
      },
      [arg.name, onValueChange],
    );

    return (
      <div
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
              <Badge variant="success" className="text-[8px] px-1.5 py-0 h-4">
                ✓
              </Badge>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="text-xs">
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
            onChange={handleChange}
            rules={{
              disabled: !arg.update || isPending,
              min: arg.min,
              max: arg.max,
              step: arg.step,
            }}
            isPending={isPending}
          />
        </div>
      </div>
    );
  },
);

ArgumentItem.displayName = 'ArgumentItem';

export default ArgumentItem;
