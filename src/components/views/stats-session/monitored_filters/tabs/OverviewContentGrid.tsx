import { memo, type ReactNode } from 'react';
import { LuInfo } from 'react-icons/lu';
import { MetricRow, TableSection } from './pid/shared';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { FilterStatusViewModel } from '../utils/statusViewModel';
import type { MetricDefinitionMap } from '@/workers/metricDefinitionParser';
import StatusArraySection from './status/StatusArraySection';
import StatusStateBadges from './status/StatusStateBadges';
import { StatusProgressRow, StatusBufferRow } from './status/StatusProgress';
import StatusMetricTooltip from './status/StatusMetricTooltip';

interface OverviewContentGridProps {
  groups: FilterStatusViewModel;
  isDetached: boolean;
  definitions?: MetricDefinitionMap;
}

const OverviewContentGrid = memo(
  ({ groups, isDetached, definitions }: OverviewContentGridProps) => {
    const infoTextMetrics = groups.textMetrics.filter(
      (metric) => metric.quoted,
    );
    const valueTextMetrics = groups.textMetrics.filter(
      (metric) => !metric.quoted,
    );
    const hasInfo = groups.info != null || infoTextMetrics.length > 0;
    const numericMetrics = groups.numericMetrics.filter(
      (metric) => !metric.graphable,
    );
    const hasMetrics =
      groups.primaryProgress != null ||
      groups.buffer != null ||
      numericMetrics.length > 0 ||
      valueTextMetrics.length > 0;
    const hasArrays = groups.arrays.length > 0;

    const infoCol: ReactNode = hasInfo ? (
      <TableSection key="info" title="Info">
        {groups.info && (
          <tr className="bg-monitor-panel border-b border-transparent">
            <td
              colSpan={2}
              className="px-2 py-2 text-xs italic text-muted-foreground"
            >
              {groups.info}
            </td>
          </tr>
        )}
        {infoTextMetrics.map((metric) => (
          <MetricRow
            key={metric.key}
            label={metric.key}
            value={metric.value}
            valueClassName="italic text-muted-foreground truncate"
          />
        ))}
      </TableSection>
    ) : null;

    const metricsCol: ReactNode = hasMetrics ? (
      <TooltipProvider delayDuration={300}>
        <TableSection key="metrics" title="Metrics">
          {groups.primaryProgress && (
            <StatusProgressRow bar={groups.primaryProgress} />
          )}
          {groups.buffer && <StatusBufferRow buffer={groups.buffer} />}
          {numericMetrics.map((metric) => {
            const def = definitions?.[metric.key];
            return (
              <MetricRow
                key={metric.key}
                label={metric.key}
                value={metric.value}
                title={metric.tooltip}
                leading={
                  def ? (
                    <StatusMetricTooltip def={def}>
                      <span className="inline-flex mr-1 cursor-help">
                        <LuInfo className="h-3 w-3 opacity-40 hover:opacity-80" />
                      </span>
                    </StatusMetricTooltip>
                  ) : undefined
                }
              />
            );
          })}
          {valueTextMetrics.map((metric) => (
            <MetricRow
              key={metric.key}
              label={metric.key}
              value={metric.value}
            />
          ))}
        </TableSection>
      </TooltipProvider>
    ) : null;

    const arraysCol: ReactNode = hasArrays ? (
      <div key="tracks" className="flex flex-col gap-1 bg-monitor-panel">
        {groups.arrays.map((array) => (
          <StatusArraySection key={array.key} array={array} />
        ))}
      </div>
    ) : null;

    if (
      !hasInfo &&
      !hasMetrics &&
      !hasArrays &&
      groups.stateBadges.length === 0
    ) {
      return null;
    }

    if (isDetached) {
      return (
        <div className="flex flex-col gap-2">
          <StatusStateBadges badges={groups.stateBadges} />
          {infoCol}
          {metricsCol}
          {arraysCol}
        </div>
      );
    }

    if (hasArrays) {
      return (
        <div className="flex flex-col gap-2">
          <StatusStateBadges badges={groups.stateBadges} />
          <div className="grid grid-cols-2 gap-2 items-start">
            {arraysCol}
            {(hasInfo || hasMetrics) && (
              <div className="flex flex-col gap-2">
                {infoCol}
                {metricsCol}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        <StatusStateBadges badges={groups.stateBadges} />
        <div className="grid grid-cols-2 gap-2 items-start">
          {infoCol}
          {metricsCol}
        </div>
      </div>
    );
  },
);

OverviewContentGrid.displayName = 'OverviewContentGrid';

export default OverviewContentGrid;
