import { TooltipProvider } from '@/components/ui/tooltip';
import { MetricRow } from '../shared/tableLayout';
import MetricInfoIcon from '../shared/MetricInfoIcon';
import { TAB_STYLES } from '../styles';
import type { NumericMetric } from '../../utils/statusViewModel';
import type { MetricDefinitionMap } from '@/workers/metricDefinitionParser';

interface ReportSectionProps {
  metrics: NumericMetric[];
  definitions?: MetricDefinitionMap;
  isDone: boolean;
}

const ReportSection = ({ metrics, definitions }: ReportSectionProps) => {
  if (metrics.length === 0) return null;

  const chunkSize = Math.ceil(metrics.length / 3);
  const chunks = [
    metrics.slice(0, chunkSize),
    metrics.slice(chunkSize, chunkSize * 2),
    metrics.slice(chunkSize * 2),
  ].filter((chunk) => chunk.length > 0);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="bg-monitor-app">
        <div className="bg-white/5 border-b border-transparent px-2 py-1.5">
          <span className={TAB_STYLES.TABLE_HEADER}>Report</span>
        </div>
        <div className="grid grid-cols-3">
          {chunks.map((chunk) => (
            <table key={chunk[0].key} className="w-full text-left table-fixed">
              <colgroup>
                <col />
                <col className="w-28" />
              </colgroup>
              <tbody>
                {chunk.map((metric) => (
                  <MetricRow
                    key={metric.key}
                    label={definitions?.[metric.key]?.label ?? metric.key}
                    value={metric.value}
                    title={metric.tooltip}
                    infoIcon={
                      <MetricInfoIcon def={definitions?.[metric.key]} />
                    }
                  />
                ))}
              </tbody>
            </table>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ReportSection;
