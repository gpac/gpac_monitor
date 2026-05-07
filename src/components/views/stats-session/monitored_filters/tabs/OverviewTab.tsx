import { memo, useMemo, type ReactNode } from 'react';
import { useAppSelector } from '@/shared/hooks/redux';
import { selectIsFilterStalled } from '@/shared/store/selectors/session/sessionStatsSelectors';
import { OverviewTabData } from '@/types/ui';
import { Badge } from '@/components/ui/badge';
import {
  formatTime,
  formatBytes,
  formatNumber,
  formatPacketRate,
  microsecondsToSeconds,
} from '@/utils/formatting';
import {
  getFilterHealthInfo,
  type FilterAlerts,
} from '../cards/shared/statusHelpers';

interface OverviewTabProps {
  filter: OverviewTabData;
  alerts?: FilterAlerts | null;
}

const MetricRow = ({
  label,
  value,
  isEven,
  valueClassName = 'text-info',
}: {
  label: string;
  value: string;
  isEven: boolean;
  valueClassName?: string;
}) => (
  <tr
    className={`${isEven ? 'bg-black/10' : 'bg-black/20'} border-b border-white/5`}
  >
    <td className="px-2 py-2 align-middle text-xs text-muted-foreground">
      {label}
    </td>
    <td
      className={`px-2 py-2 align-middle text-xs font-medium tabular-nums text-right w-28 whitespace-nowrap ${valueClassName}`}
    >
      {value}
    </td>
  </tr>
);

const TableSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <div className="bg-monitor-app">
    <table className="w-full text-left table-fixed">
      <colgroup>
        <col />
        <col className="w-28" />
      </colgroup>
      <thead>
        <tr className="bg-monitor-panel border-b border-white/10">
          <th
            colSpan={2}
            className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide"
          >
            {title}
          </th>
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

const OverviewTab = memo(({ filter, alerts }: OverviewTabProps) => {
  const { status, type, idx, time } = filter;

  const isStalled = useAppSelector(selectIsFilterStalled(idx.toString()));
  const healthInfo = getFilterHealthInfo(status, isStalled, alerts);

  const metrics = useMemo(() => {
    const secs = microsecondsToSeconds(time);
    return {
      throughput: secs > 0 ? `${formatBytes(filter.bytes_done / secs)}/s` : '—',
      packetRate: secs > 0 ? formatPacketRate(filter.pck_done / secs) : '—',
    };
  }, [time, filter.bytes_done, filter.pck_done]);

  const totalErrors = (filter.errors || 0) + (filter.current_errors || 0);

  return (
    <div className="flex flex-col gap-2 p-2">
      {/* Status strip */}
      <div className="flex items-center gap-2 px-3 py-2 bg-monitor-panel/40 rounded border-b border-monitor-line/10 text-xs shrink-0">
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
          Live <span className="text-error">⏺</span>
        </span>
      </div>

      {/* 2-column grid: Real-time | Packets + Data */}
      <div className="grid grid-cols-2 gap-2">
        <TableSection title="Real-time">
          <MetricRow label="Throughput" value={metrics.throughput} isEven />
          <MetricRow
            label="Packet rate"
            value={metrics.packetRate}
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
});

OverviewTab.displayName = 'OverviewTab';

export default OverviewTab;
