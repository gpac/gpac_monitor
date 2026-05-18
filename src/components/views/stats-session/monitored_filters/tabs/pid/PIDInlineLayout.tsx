import { memo, useState } from 'react';
import type { PIDWithIndex } from '../../../types';
import type { PIDMetricMode } from '../../../types/pid';
import { PIDTable } from './shared';
import PIDGraphSection from './PIDGraphSection';

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
        <PIDGraphSection mode={mode} onHoverPid={onHoverPid} />
      </div>
    );
  },
);

PIDInlineLayout.displayName = 'PIDInlineLayout';

export default PIDInlineLayout;
