import { memo } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/utils/core';
import type { PIDWithIndex } from '../../../types';
import type { PIDMetricMode } from '../../../types/pid';
import {
  PID_METRIC_GROUPS,
  PID_METRICS_BY_KEY,
} from '../../charts/config/pidHistoryChartConfig';
import PIDTableRow from './PIDTableRow';
import { TAB_STYLES } from '../styles';

type PIDTableVariant = 'input' | 'output';

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
    <thead>
      <tr className="border-b border-white/10 bg-monitor-panel">
        <th className={TAB_STYLES.TABLE_HEADER}>Infos</th>
        {PID_METRIC_GROUPS.map(({ key: metric, label }) => {
          const isGroupActive =
            activeMetric === metric ||
            PID_METRICS_BY_KEY[activeMetric as PIDMetricMode]?.group === metric;
          const displayLabel =
            isGroupActive && activeMetric !== metric
              ? (PID_METRICS_BY_KEY[activeMetric as PIDMetricMode]?.label ??
                label)
              : label;
          return (
            <th key={metric} className="px-2 py-1.5">
              <button
                onClick={() => onMetricClick?.(metric)}
                className={cn(
                  'text-[0.714rem] font-medium uppercase tracking-wide transition-colors',
                  isGroupActive
                    ? 'text-monitor-active-tab border-b border-monitor-active-tab pb-0.5'
                    : 'text-muted-foreground hover:text-foreground cursor-pointer',
                )}
              >
                {displayLabel}
              </button>
            </th>
          );
        })}
      </tr>
    </thead>
    <tbody>
      {pids.map((pid) => (
        <PIDTableRow
          key={`${pid.name}-${pid.pidIdx}`}
          pid={pid}
          filterIdx={filterIdx}
          onOpenProps={onOpenProps}
          variant={variant}
          hoveredPidKey={hoveredPidKey}
          activeMetric={activeMetric}
          onMetricClick={onMetricClick}
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
        <div className="bg-monitor-app">
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
