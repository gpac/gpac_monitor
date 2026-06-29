import { type ReactNode } from 'react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipArrow,
} from '@/components/ui/tooltip';

export type TooltipRowData = {
  label: string;
  value: string | null;
  active?: boolean;
  onChart?: () => void;
};

const TooltipRow = ({ label, value, active, onChart }: TooltipRowData) => (
  <div className="flex justify-between gap-4 text-xs">
    <span
      className={
        active
          ? 'text-monitor-active-filter font-medium'
          : 'text-muted-foreground'
      }
    >
      {label}
    </span>
    <div className="flex items-center gap-1">
      <span
        className={`tabular-nums font-mono ${active ? 'text-monitor-active-filter font-medium' : 'text-info'}`}
      >
        {value ?? '—'}
      </span>
      {onChart && (
        <button
          onClick={onChart}
          className="text-muted-foreground hover:text-monitor-active-filter opacity-60 hover:opacity-100 transition-opacity leading-none"
          title="Chart this metric"
        >
          +
        </button>
      )}
    </div>
  </div>
);

interface PIDMetricTooltipProps {
  rows: TooltipRowData[];
  children: ReactNode;
}

const PIDMetricTooltip = ({ rows, children }: PIDMetricTooltipProps) => {
  const visibleRows = rows.filter((row) => row.value != null);

  if (visibleRows.length === 0) return <>{children}</>;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top" className="min-w-[220px]">
        <div className="flex flex-col gap-1">
          {visibleRows.map((row) => (
            <TooltipRow key={row.label} {...row} />
          ))}
        </div>
        <TooltipArrow className="fill-gray-900" />
      </TooltipContent>
    </Tooltip>
  );
};

export default PIDMetricTooltip;
