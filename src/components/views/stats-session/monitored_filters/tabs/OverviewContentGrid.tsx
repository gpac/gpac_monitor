import { memo, useMemo, type ReactNode } from 'react';
import { LuInfo } from 'react-icons/lu';
import { MetricRow, TableSection } from './shared/tableLayout';
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

function makeTooltipIcon(
  def: Parameters<typeof StatusMetricTooltip>[0]['def'] | undefined,
) {
  if (!def) return undefined;
  return (
    <StatusMetricTooltip def={def}>
      <span className="inline-flex mr-1 cursor-help">
        <LuInfo className="h-3 w-3 text-muted-foreground" />
      </span>
    </StatusMetricTooltip>
  );
}

const OverviewContentGrid = memo(
  ({ groups, isDetached, definitions }: OverviewContentGridProps) => {
    const infoTextMetrics = groups.textMetrics.filter((m) => m.quoted);
    const valueTextMetrics = groups.textMetrics.filter((m) => !m.quoted);
    const hasInfo = groups.info != null || infoTextMetrics.length > 0;

    // Stable split across definitions/isDetached re-renders
    const [completionMetrics, liveMetrics] = useMemo(
      () => [
        groups.numericMetrics.filter((m) => m.completionSnapshot),
        groups.numericMetrics.filter(
          (m) => !m.graphable && !m.completionSnapshot,
        ),
      ],
      [groups.numericMetrics],
    );

    const hasCompletion = completionMetrics.length > 0;
    const hasMetrics =
      groups.primaryProgress != null ||
      groups.buffer != null ||
      liveMetrics.length > 0 ||
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
            <StatusProgressRow
              bar={groups.primaryProgress}
              infoIcon={makeTooltipIcon(
                definitions?.[groups.primaryProgress.key],
              )}
            />
          )}
          {groups.buffer && (
            <StatusBufferRow
              buffer={groups.buffer}
              infoIcon={makeTooltipIcon(definitions?.['buffer'])}
            />
          )}
          {liveMetrics.map((metric) => (
            <MetricRow
              key={metric.key}
              label={metric.key}
              value={metric.value}
              title={metric.tooltip}
              infoIcon={makeTooltipIcon(definitions?.[metric.key])}
            />
          ))}
          {valueTextMetrics.map((metric) => (
            <MetricRow
              key={metric.key}
              label={metric.key}
              value={metric.value}
              infoIcon={makeTooltipIcon(definitions?.[metric.key])}
            />
          ))}
        </TableSection>
      </TooltipProvider>
    ) : null;

    const completionCol: ReactNode = hasCompletion ? (
      <div className="w-1/3">
        <TooltipProvider delayDuration={300}>
          <TableSection key="report" title="Report">
            {completionMetrics.map((metric) => (
              <MetricRow
                key={metric.key}
                label={metric.key}
                value={metric.value}
                title={metric.tooltip}
                infoIcon={makeTooltipIcon(definitions?.[metric.key])}
              />
            ))}
          </TableSection>
        </TooltipProvider>
      </div>
    ) : null;

    const arraysCol: ReactNode = hasArrays ? (
      <TooltipProvider delayDuration={300}>
        <div key="tracks" className="flex flex-col gap-1 bg-monitor-panel">
          {groups.arrays.map((array) => (
            <StatusArraySection
              key={array.key}
              array={array}
              definitions={definitions}
            />
          ))}
        </div>
      </TooltipProvider>
    ) : null;

    if (
      !hasInfo &&
      !hasMetrics &&
      !hasCompletion &&
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
          {completionCol}
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
            {(hasInfo || hasMetrics || hasCompletion) && (
              <div className="flex flex-col gap-2">
                {infoCol}
                {metricsCol}
                {completionCol}
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
        {completionCol}
      </div>
    );
  },
);

OverviewContentGrid.displayName = 'OverviewContentGrid';

export default OverviewContentGrid;
