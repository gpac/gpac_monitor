import { LuInfo } from 'react-icons/lu';
import MetricTooltip from './MetricTooltip';
import type { MetricDef } from '@/workers/metricDefinitionParser';

const MetricInfoIcon = ({ def }: { def?: MetricDef }) => {
  if (!def) return null;
  return (
    <MetricTooltip def={def}>
      <span className="inline-flex mr-1 cursor-help">
        <LuInfo className="h-3 w-3 text-muted-foreground" />
      </span>
    </MetricTooltip>
  );
};

export default MetricInfoIcon;
