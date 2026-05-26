import { memo, useMemo } from 'react';
import { LuSettings } from 'react-icons/lu';
import { useAppSelector } from '@/shared/hooks/redux';
import { selectIsFilterStalled } from '@/shared/store/selectors/session/sessionStatsSelectors';
import { OverviewTabData } from '@/types/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  formatTime,
  formatBytes,
  formatNumber,
  formatPacketRate,
  microsecondsToSeconds,
} from '@/utils/formatting';
import { getFilterHealthInfo, type FilterAlerts } from '../utils/statusHelpers';
import { MetricRow, TableSection } from './pid/shared';
import { useDataMode } from '@/shared/hooks/data/useDataMode';

interface OverviewTabProps {
  filter: OverviewTabData;
  alerts?: FilterAlerts | null;
  onOpenProperties?: () => void;
}

const OverviewTab = memo(
  ({ filter, alerts, onOpenProperties }: OverviewTabProps) => {
    const { status, type, idx, time } = filter;
    const { isHistory } = useDataMode();
    const isStalled = useAppSelector(selectIsFilterStalled(idx.toString()));
    const healthInfo = getFilterHealthInfo(status, isStalled, alerts);

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
        {/* Status strip */}
        <div className="flex items-center gap-2 px-3 py-2 bg-monitor-panel/40 rounded border-b border-monitor-line/10 text-xs shrink-0">
          {onOpenProperties && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenProperties}
              className="h-6 px-1.5 py-0"
              title="Display filter arguments"
            >
              <LuSettings className="h-3.5 w-3.5" />
            </Button>
          )}
          <span className="font-medium text-muted-foreground">
            [{type || 'unknown'}]
          </span>
          <Badge
            variant={healthInfo.variant}
            className="text-xs py-0 px-1.5 h-fit"
          >
            ● {healthInfo.label}
          </Badge>
          <span className="text-muted-foreground/50">·</span>
          <span className="text-muted-foreground">Index: {idx}</span>
          <span className="text-muted-foreground/50">·</span>
          <span className="text-muted-foreground">
            Uptime:{' '}
            <span className="font-medium tabular-nums">{formatTime(time)}</span>
          </span>
          <span className="ml-auto text-muted-foreground/70">
            {isHistory ? (
              <>
                <span className="text-purple-400"> ⏺ </span> History
              </>
            ) : (
              <>
                Live <span className="text-error">⏺</span>
              </>
            )}
          </span>
        </div>

        {/* 2-column grid: Processing | Packets + Data */}
        <div className="grid grid-cols-2 gap-2">
          <TableSection title="Processing">
            <MetricRow
              label="Filter Process speed"
              value={metrics.processSpeed}
              isEven
            />
            <MetricRow
              label="Packets/s"
              value={metrics.processPacketRate}
              isEven={false}
            />
          </TableSection>

          <div className="flex flex-col gap-2">
            <TableSection title="Packets">
              <MetricRow
                label="Done"
                value={formatNumber(filter.pck_done)}
                isEven
              />
              <MetricRow
                label="Sent"
                value={formatNumber(filter.pck_sent)}
                isEven={false}
              />
              {filter.pck_ifce_sent !== undefined && (
                <MetricRow
                  label="Interface"
                  value={formatNumber(filter.pck_ifce_sent)}
                  isEven
                />
              )}
            </TableSection>
            <TableSection title="Data">
              <MetricRow
                label="Done"
                value={formatBytes(filter.bytes_done)}
                isEven
              />
              <MetricRow
                label="Sent"
                value={formatBytes(filter.bytes_sent)}
                isEven={false}
              />
            </TableSection>
          </div>
        </div>

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
