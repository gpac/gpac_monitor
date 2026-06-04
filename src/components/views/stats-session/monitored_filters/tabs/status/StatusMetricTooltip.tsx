import { type ReactNode } from 'react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipArrow,
} from '@/components/ui/tooltip';
import type { MetricDef } from '@/workers/metricDefinitionParser';

interface StatusMetricTooltipProps {
  def: MetricDef;
  children: ReactNode;
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-4 text-xs">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-mono text-info">{value}</span>
  </div>
);

// TooltipProvider must be provided by the parent (hoist it to avoid N instances).
const StatusMetricTooltip = ({ def, children }: StatusMetricTooltipProps) => (
  <Tooltip>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent side="top" className="min-w-[200px]">
      <div className="flex flex-col gap-1">
        <Row label="Label" value={def.label} />
        <Row label="Type" value={def.type} />
        {def.unit && <Row label="Unit" value={def.unit} />}
        {def.info && <Row label="Info" value={def.info} />}
        <Row label="Filter" value={def.freg} />
      </div>
      <TooltipArrow className="fill-gray-900" />
    </TooltipContent>
  </Tooltip>
);

export default StatusMetricTooltip;
