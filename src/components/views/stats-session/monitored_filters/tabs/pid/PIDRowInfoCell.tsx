import { memo, useCallback } from 'react';
import { LuEye } from 'react-icons/lu';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { Badge } from '@/components/ui/badge';
import { getStreamTypeBadgeConfig } from '@/utils/filters/streamType';
import { toggleSelectedPid } from '@/shared/store/slices/monitoredFilterSlice';
import { selectPidColorIndexByKey } from '@/shared/store/selectors';
import { PID_SELECTION_COLORS } from './utils/pidColors';
import { buildPIDDisplayLabel } from './utils/pidLabel';
import { useIsDetached } from '../../FilterViewContext';
import type { PIDWithIndex } from '../../../types';

interface PIDRowInfoCellProps {
  pid: PIDWithIndex;
  filterIdx: number;
  variant: 'input' | 'output';
  pidKey: string;
  infoLine: string;
  onOpenProps: () => void;
}

const PIDRowInfoCell = memo(
  ({
    pid,
    filterIdx,
    variant,
    pidKey,
    infoLine,
    onOpenProps,
  }: PIDRowInfoCellProps) => {
    const dispatch = useAppDispatch();
    const isDetached = useIsDetached();
    const colorIndex = useAppSelector(
      (state) => selectPidColorIndexByKey(state)[pidKey] ?? -1,
    );
    const isSelected = colorIndex >= 0;

    const badgeConfig = getStreamTypeBadgeConfig(pid.type);

    const handleToggleSelect = useCallback(() => {
      dispatch(
        toggleSelectedPid({
          filterIdx,
          direction: variant,
          pidIndex: pid.ipidIdx,
          label: buildPIDDisplayLabel(pid),
        }),
      );
    }, [dispatch, filterIdx, variant, pid.ipidIdx, pid]);

    return (
      <div className="min-w-0 flex items-center gap-1.5">
        {!isDetached && (
          <input
            type="radio"
            checked={isSelected}
            readOnly
            onClick={handleToggleSelect}
            title="Select PID for temporal graph"
            className="flex-shrink-1 cursor-pointer"
            style={
              isSelected
                ? { accentColor: PID_SELECTION_COLORS[colorIndex] }
                : undefined
            }
          />
        )}
        {variant === 'input' && (
          <button
            onClick={onOpenProps}
            className=" rounded bg-gray-700/50 border border-gray-600/50 text-gray-300 hover:bg-gray-700/80 flex-shrink-0"
            title="View input properties"
          >
            <LuEye className="h-4 w-5" />
          </button>
        )}
        <Badge
          variant="outline"
          className={`px-1.5 py-0 h-5 font-mono font-bold text-[10px] flex-shrink-0 ${badgeConfig.className}`}
        >
          {badgeConfig.label}
        </Badge>
        <span className="min-w-0 truncate text-muted-foreground">
          {infoLine}
        </span>
      </div>
    );
  },
);

PIDRowInfoCell.displayName = 'PIDRowInfoCell';

export default PIDRowInfoCell;
