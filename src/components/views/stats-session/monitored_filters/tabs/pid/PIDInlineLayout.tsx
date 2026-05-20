import { memo, useEffect, useState } from 'react';
import { useAppDispatch } from '@/shared/hooks/redux';
import { clearSelectedPidsByFilter } from '@/shared/store/slices/monitoredFilterSlice';
import type { PIDWithIndex } from '../../../types';
import type { PIDMetricMode } from '../../../types/pid';
import { PIDTable } from './shared';
import PIDGraphSection from './PIDGraphSection';

interface PIDInlineLayoutProps {
  pids: PIDWithIndex[];
  filterIdx: number;
  onOpenProps: (filterIdx: number, pidIdx: number) => void;
  hoveredPidKey: string | null;
  variant?: 'input' | 'output';
}

const PIDInlineLayout = memo(
  ({
    pids,
    filterIdx,
    onOpenProps,
    hoveredPidKey,
    variant = 'input',
  }: PIDInlineLayoutProps) => {
    const dispatch = useAppDispatch();
    const [mode, setMode] = useState<PIDMetricMode>('bitrate');

    useEffect(
      () => () => {
        dispatch(clearSelectedPidsByFilter(filterIdx));
      },
      [dispatch, filterIdx],
    );

    return (
      <div className="flex flex-col gap-2">
        <PIDTable
          pids={pids}
          filterIdx={filterIdx}
          onOpenProps={onOpenProps}
          variant={variant}
          hoveredPidKey={hoveredPidKey}
          activeMetric={mode}
          onMetricClick={setMode}
        />
        <PIDGraphSection
          filterIdx={filterIdx}
          mode={mode}
          onModeChange={setMode}
          totalPids={pids.length}
        />
      </div>
    );
  },
);

PIDInlineLayout.displayName = 'PIDInlineLayout';

export default PIDInlineLayout;
