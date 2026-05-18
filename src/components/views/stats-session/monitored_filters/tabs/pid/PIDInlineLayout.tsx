import { memo, useState } from 'react';
import type { PIDWithIndex } from '../../../types';
import type { PIDMetricMode } from '../../../types/pid';
import { PIDTable } from './shared';
import PIDGraphSection from './PIDGraphSection';

const PID_SPLIT_THRESHOLD = 4;

interface PIDInlineLayoutProps {
  pids: PIDWithIndex[];
  filterIdx: number;
  onOpenProps: (filterIdx: number, pidIdx: number) => void;
  hoveredPidKey: string | null;
  onHoverPid: (key: string | null) => void;
  variant?: 'input' | 'output';
}

const PIDInlineLayout = memo(
  ({
    pids,
    filterIdx,
    onOpenProps,
    hoveredPidKey,
    onHoverPid,
    variant = 'input',
  }: PIDInlineLayoutProps) => {
    const [mode, setMode] = useState<PIDMetricMode>('bitrate');
    const half = Math.ceil(pids.length / 2);
    const isSplit = pids.length >= PID_SPLIT_THRESHOLD;

    return (
      <div className="flex flex-col gap-2">
        {isSplit ? (
          <div className="grid grid-cols-2 gap-2">
            <PIDTable
              pids={pids.slice(0, half)}
              filterIdx={filterIdx}
              onOpenProps={onOpenProps}
              variant={variant}
              hoveredPidKey={hoveredPidKey}
              activeMetric={mode}
              onMetricClick={setMode}
            />
            <PIDTable
              pids={pids.slice(half)}
              filterIdx={filterIdx}
              onOpenProps={onOpenProps}
              variant={variant}
              hoveredPidKey={hoveredPidKey}
              activeMetric={mode}
              onMetricClick={setMode}
            />
          </div>
        ) : (
          <PIDTable
            pids={pids}
            filterIdx={filterIdx}
            onOpenProps={onOpenProps}
            variant={variant}
            hoveredPidKey={hoveredPidKey}
            activeMetric={mode}
            onMetricClick={setMode}
          />
        )}
        <PIDGraphSection mode={mode} onHoverPid={onHoverPid} />
      </div>
    );
  },
);

PIDInlineLayout.displayName = 'PIDInlineLayout';

export default PIDInlineLayout;
