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
};

const TooltipRow = ({ label, value, active }: TooltipRowData) => (
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
    <span
      className={`tabular-nums font-mono ${active ? 'text-monitor-active-filter font-medium' : 'text-info'}`}
    >
      {value ?? '—'}
    </span>
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
