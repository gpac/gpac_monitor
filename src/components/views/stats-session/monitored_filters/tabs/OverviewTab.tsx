import { memo, useMemo } from 'react';
import { useAppSelector } from '@/shared/hooks/redux';
import { selectIsFilterStalled } from '@/shared/store/selectors/session/sessionStatsSelectors';
import { OverviewTabData } from '@/types/ui';
import {
  formatBytes,
  formatPacketRate,
  microsecondsToSeconds,
} from '@/utils/formatting';
import { getFilterHealthInfo, type FilterAlerts } from '../utils/statusHelpers';
import { buildFilterStatusViewModel } from '../utils/statusViewModel';
import { useIsDetached } from '../FilterViewContext';
import { selectMetricDefinitions } from '@/shared/store/selectors';
import { MetricRow, TableSection } from './shared/tableLayout';
import { useCollectStatusMetricSamples } from './hooks/useCollectStatusMetricSamples';
import FilterIdentityStrip from './FilterIdentityStrip';
import OverviewContentGrid from './OverviewContentGrid';
import RuntimeDetailsSection from './RuntimeDetailsSection';
import StatusGraphCard from './status/StatusGraphCard';

interface OverviewTabProps {
  filter: OverviewTabData;
  alerts?: FilterAlerts | null;
  onOpenProperties?: () => void;
}

const OverviewTab = memo(
  ({ filter, alerts, onOpenProperties }: OverviewTabProps) => {
    const { parsedStatus, type, filterIdx, time, name } = filter;
    const isDetached = useIsDetached();

    const isStalled = useAppSelector(
      selectIsFilterStalled(filterIdx.toString()),
    );
    const definitions = useAppSelector(selectMetricDefinitions);
    const healthInfo = getFilterHealthInfo(
      parsedStatus,
      isStalled,
      alerts ?? null,
    );

    const statusGroups = useMemo(
      () => buildFilterStatusViewModel(parsedStatus),
      [parsedStatus],
    );

    const graphableMetrics = useMemo(
      () =>
        statusGroups.numericMetrics
          .filter((metric) => metric.graphable)
          .map((metric) => ({ key: metric.key, rawValue: metric.rawValue })),
      [statusGroups.numericMetrics],
    );
    useCollectStatusMetricSamples(filterIdx, graphableMetrics, time);

    const processing = useMemo(() => {
      const secs = microsecondsToSeconds(time);
      return {
        processSpeed:
          secs > 0 ? `${formatBytes(filter.bytes_done / secs)}/s` : '—',
        processPacketRate:
          secs > 0 ? formatPacketRate(filter.pck_done / secs) : '—',
        pckDone: filter.pck_done,
        pckSent: filter.pck_sent,
        pckIfceSent: filter.pck_ifce_sent,
        bytesDone: filter.bytes_done,
        bytesSent: filter.bytes_sent,
      };
    }, [
      time,
      filter.bytes_done,
      filter.bytes_sent,
      filter.pck_done,
      filter.pck_sent,
      filter.pck_ifce_sent,
    ]);

    const totalErrors = (filter.errors || 0) + (filter.current_errors || 0);

    return (
      <div className="flex flex-col gap-2 p-2">
        <FilterIdentityStrip
          type={type}
          idx={filterIdx}
          time={time}
          healthLabel={healthInfo.label}
          healthVariant={healthInfo.variant}
          onOpenProperties={onOpenProperties}
        />
        {graphableMetrics.length > 0 && (
          <StatusGraphCard
            metrics={statusGroups.numericMetrics}
            filterIdx={filterIdx}
            filterName={name}
          />
        )}

        <OverviewContentGrid
          groups={statusGroups}
          isDetached={isDetached}
          definitions={definitions}
        />

        <RuntimeDetailsSection processing={processing} />

        {totalErrors > 0 && (
          <TableSection title="Errors">
            <MetricRow
              label="Total"
              value={String(totalErrors)}
              valueClassName="text-destructive"
            />
          </TableSection>
        )}
      </div>
    );
  },
);

OverviewTab.displayName = 'OverviewTab';

export default OverviewTab;
