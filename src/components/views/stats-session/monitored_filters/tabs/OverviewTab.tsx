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
import { MetricRow, TableSection } from './pid/shared';
import FilterIdentityStrip from './FilterIdentityStrip';
import StatusMetricsSection from './status/StatusMetricsSection';
import FilterProcessingMetrics from './FilterProcessingMetrics';

interface OverviewTabProps {
  filter: OverviewTabData;
  alerts?: FilterAlerts | null;
  onOpenProperties?: () => void;
}

const OverviewTab = memo(
  ({ filter, alerts, onOpenProperties }: OverviewTabProps) => {
    const { parsedStatus, type, idx, time, name } = filter;

    const isStalled = useAppSelector(selectIsFilterStalled(idx.toString()));
    const healthInfo = getFilterHealthInfo(
      parsedStatus,
      isStalled,
      alerts ?? null,
    );

    const statusGroups = useMemo(
      () => buildFilterStatusViewModel(parsedStatus),
      [parsedStatus],
    );

    const hasStatusContent =
      statusGroups.info != null ||
      statusGroups.primaryProgress != null ||
      statusGroups.numericMetrics.length > 0 ||
      statusGroups.textMetrics.length > 0 ||
      statusGroups.stateBadges.length > 0 ||
      statusGroups.arrays.length > 0;

    const metrics = useMemo(() => {
      const secs = microsecondsToSeconds(time);
      return {
        processSpeed:
          secs > 0 ? `${formatBytes(filter.bytes_done / secs)}/s` : '—',
        processPacketRate:
          secs > 0 ? formatPacketRate(filter.pck_done / secs) : '—',
      };
    }, [time, filter.bytes_done, filter.pck_done]);

    const totalErrors = (filter.errors || 0) + (filter.current_errors || 0);

    return (
      <div className="flex flex-col gap-2 p-2">
        <FilterIdentityStrip
          type={type}
          idx={idx}
          time={time}
          healthLabel={healthInfo.label}
          healthVariant={healthInfo.variant}
          onOpenProperties={onOpenProperties}
        />

        {hasStatusContent && (
          <StatusMetricsSection
            groups={statusGroups}
            filterIdx={idx}
            filterName={name}
          />
        )}

        <FilterProcessingMetrics
          processSpeed={metrics.processSpeed}
          processPacketRate={metrics.processPacketRate}
          pckDone={filter.pck_done}
          pckSent={filter.pck_sent}
          pckIfceSent={filter.pck_ifce_sent}
          bytesDone={filter.bytes_done}
          bytesSent={filter.bytes_sent}
        />

        {totalErrors > 0 && (
          <TableSection title="Errors">
            <MetricRow
              label="Total"
              value={String(totalErrors)}
              isEven
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
