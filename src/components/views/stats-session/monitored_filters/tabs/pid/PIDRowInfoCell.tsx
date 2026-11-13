import { memo, useCallback } from 'react';
import { LuEye } from 'react-icons/lu';
import { GpacStreamType } from '@/types/domain/gpac/stream-types';
import PIDPreviewButton from './preview/PIDPreviewButton';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { useDataMode } from '@/shared/hooks/data/useDataMode';
import { Badge } from '@/components/ui/badge';
import {
  getStreamTypeBadgeConfig,
  STREAM_TYPE_SHORT_LABEL,
} from '@/utils/filters/streamType';
import { PID_SELECTION_COLORS } from './utils/pidColors';
import { toggleSelectedPid } from '@/shared/store/slices/monitoredFilterSlice';
import {
  selectIsPreviewSupported,
  selectPidColorIndexByKey,
} from '@/shared/store/selectors';
import { buildPIDDisplayLabel } from './utils/pidLabel';
import { canPreview } from '@/utils/gpac/webcodecs-config';
import { GraphRadio } from '@/components/common/charts';
import type { PIDWithIndex } from '../../../types';

interface PIDRowInfoCellProps {
  pid: PIDWithIndex;
  filterIdx: number;
  variant: 'input' | 'output';
  pidKey: string;
  infoLine: string;
  onOpenProps: () => void;
  isPreviewOpen: boolean;
  onTogglePreview: (pidIdx: number) => void;
}

const PIDRowInfoCell = memo(
  ({
    pid,
    filterIdx,
    variant,
    pidKey,
    infoLine,
    onOpenProps,
    isPreviewOpen,
    onTogglePreview,
  }: PIDRowInfoCellProps) => {
    const dispatch = useAppDispatch();
    const { isLive } = useDataMode();
    const isPreviewSupported = useAppSelector(selectIsPreviewSupported);
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
          pidIndex: pid.pidIdx,
          label: buildPIDDisplayLabel(pid),
          infoLine,
          streamTypeLabel: STREAM_TYPE_SHORT_LABEL[pid.type],
        }),
      );
    }, [dispatch, filterIdx, variant, pid, infoLine]);

    const selectIfNeeded = useCallback(() => {
      if (!isSelected) handleToggleSelect();
    }, [isSelected, handleToggleSelect]);

    const handleOpenProps = useCallback(() => {
      selectIfNeeded();
      onOpenProps();
    }, [selectIfNeeded, onOpenProps]);

    return (
      <div className="min-w-0 flex items-center gap-1.5" title={infoLine}>
        <GraphRadio
          active={isSelected}
          onClick={handleToggleSelect}
          label={buildPIDDisplayLabel(pid)}
          color={isSelected ? PID_SELECTION_COLORS[colorIndex] : undefined}
        />
        {variant === 'input' && (
          <button
            onClick={handleOpenProps}
            className=" rounded bg-gray-700/50 border border-gray-600/50 text-gray-300 hover:bg-gray-700/80 flex-shrink-0"
            title="View input properties"
          >
            <LuEye className="h-4 w-5" />
          </button>
        )}
        {isLive &&
          isPreviewSupported &&
          pid.type === GpacStreamType.Visual &&
          canPreview(pid.codec) && (
            <PIDPreviewButton
              pid={pid}
              onSelect={selectIfNeeded}
              isPreviewOpen={isPreviewOpen}
              onTogglePreview={onTogglePreview}
            />
          )}
        <Badge
          variant="outline"
          className={`px-1.5 py-0 h-5 font-mono font-bold text-[0.714rem] flex-shrink-0 ${isSelected ? '' : badgeConfig.className}`}
          style={
            isSelected
              ? {
                  borderColor: PID_SELECTION_COLORS[colorIndex],
                  color: PID_SELECTION_COLORS[colorIndex],
                }
              : undefined
          }
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
