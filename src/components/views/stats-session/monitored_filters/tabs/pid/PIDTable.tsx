import { memo } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/utils/core';
import type { PIDWithIndex } from '../../../types';
import type { PIDMetricMode } from '../../../types/pid';
import PIDTableRow from './PIDTableRow';
import { TAB_STYLES } from '../styles';

type PIDTableVariant = 'input' | 'output';

export const CLICKABLE_METRICS: { metric: PIDMetricMode; label: string }[] = [
  { metric: 'bufferTime', label: 'Buffer' },
  { metric: 'bitrate', label: 'Avg Bitrate' },
  { metric: 'processTime', label: 'Proc.' },
  { metric: 'processRate', label: 'Proc. Rate' },
];

interface PIDTableProps {
  pids: PIDWithIndex[];
  filterIdx: number;
  onOpenProps: (filterIdx: number, pidIdx: number) => void;
  variant?: PIDTableVariant;
  hoveredPidKey?: string | null;
  activeMetric?: PIDMetricMode;
  onMetricClick?: (metric: PIDMetricMode) => void;
}

interface TableCoreProps {
  pids: PIDWithIndex[];
  filterIdx: number;
  onOpenProps: (filterIdx: number, pidIdx: number) => void;
  variant: PIDTableVariant;
  hoveredPidKey: string | null;
  activeMetric?: PIDMetricMode;
  onMetricClick?: (metric: PIDMetricMode) => void;
}

const TableCore = ({
  pids,
  filterIdx,
  onOpenProps,
  variant,
  hoveredPidKey,
  activeMetric,
  onMetricClick,
}: TableCoreProps) => (
  <table className="w-full text-left table-fixed">
    <thead className="sticky top-0 z-10">
      <tr className="border-b border-white/10 bg-monitor-panel">
        <th className={TAB_STYLES.TABLE_HEADER}>Infos</th>
        {CLICKABLE_METRICS.map(({ metric, label }) => (
          <th key={metric} className="px-2 py-1.5">
            <button
              onClick={() => onMetricClick?.(metric)}
              className={cn(
                'text-[10px] font-medium uppercase tracking-wide transition-colors',
                activeMetric === metric
                  ? 'text-monitor-active-tab border-b border-monitor-active-tab pb-0.5'
                  : 'text-muted-foreground hover:text-foreground cursor-pointer',
              )}
            >
              {label}
            </button>
          </th>
        ))}
        <th className={TAB_STYLES.TABLE_HEADER}>TS</th>
      </tr>
    </thead>
    <tbody>
      {pids.map((pid, index) => (
        <PIDTableRow
          key={`${pid.name}-${pid.pidIdx}`}
          pid={pid}
          filterIdx={filterIdx}
          onOpenProps={onOpenProps}
          isEven={index % 2 === 0}
          variant={variant}
          hoveredPidKey={hoveredPidKey}
        />
      ))}
    </tbody>
  </table>
);

const PIDTable = memo(
  ({
    pids,
    filterIdx,
    onOpenProps,
    variant = 'input',
    hoveredPidKey = null,
    activeMetric,
    onMetricClick,
  }: PIDTableProps) => {
    return (
      <TooltipProvider delayDuration={200}>
        <div className="bg-monitor-app overflow-hidden">
          <TableCore
            pids={pids}
            filterIdx={filterIdx}
            onOpenProps={onOpenProps}
            variant={variant}
            hoveredPidKey={hoveredPidKey}
            activeMetric={activeMetric}
            onMetricClick={onMetricClick}
          />
        </div>
      </TooltipProvider>
    );
  },
);

PIDTable.displayName = 'PIDTable';

export default PIDTable;
