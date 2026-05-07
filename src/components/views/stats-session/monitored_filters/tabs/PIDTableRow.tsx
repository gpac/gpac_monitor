import { memo, useCallback } from 'react';
import { LuEye } from 'react-icons/lu';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/utils/formatting';
import { getPIDStatusBadge } from '@/utils/gpac';
import { getStreamTypeBadgeConfig } from '@/utils/filters/streamType';
import {
  formatPidBuffer,
  formatPidBitrate,
  formatLastTsSent,
} from '../../utils/pidFormatters';
import type { PIDWithIndex } from '../../types';
import { usePIDInfoStats } from './hooks/usePIDInfoStats';
import { usePIDBufferStats } from './hooks/usePIDBufferStats';
import { usePIDPerformanceStats } from './hooks/usePIDPerformanceStats';
import PIDMetricTooltip from './PIDMetricTooltip';

type PIDTableRowVariant = 'input' | 'output';

interface PIDTableRowProps {
  pid: PIDWithIndex;
  filterIdx: number;
  onOpenProps: (filterIdx: number, ipidIdx: number) => void;
  isEven: boolean;
  variant?: PIDTableRowVariant;
}

const PIDTableRow = memo(
  ({
    pid,
    filterIdx,
    onOpenProps,
    isEven,
    variant = 'input',
  }: PIDTableRowProps) => {
    const handleOpenProps = useCallback(
      () => onOpenProps(filterIdx, pid.ipidIdx),
      [onOpenProps, filterIdx, pid.ipidIdx],
    );

    const infoStats = usePIDInfoStats(pid);
    const bufferStats = usePIDBufferStats(pid);
    const perfStats = usePIDPerformanceStats(pid);

    const badgeConfig = getStreamTypeBadgeConfig(pid.type);
    const statusBadge = getPIDStatusBadge(pid);
    const bgClass = isEven ? 'bg-black/10' : 'bg-black/20';

    return (
      <tr className={`${bgClass} border-b border-white/5`}>
        {/* Infos */}
        <td className="px-2 py-2 align-middle text-xs">
          <div className="min-w-0 flex items-center gap-1.5">
            {variant === 'input' && (
              <button
                onClick={handleOpenProps}
                className="p-0.5 rounded bg-gray-700/50 border border-gray-600/50 text-gray-300 hover:bg-gray-700/80 flex-shrink-0"
                title="View input properties"
              >
                <LuEye className="h-4 w-5" />
              </button>
            )}
            <Badge
              variant="outline"
              className={`px-1.5 py-0 h-5 font-mono font-bold text-[10px] flex-shrink-0 ${badgeConfig.className}`}
            >
              {badgeConfig.label}
            </Badge>
            <span className="min-w-0 truncate text-muted-foreground">
              {infoStats.infoLine}
            </span>
          </div>
        </td>

        {/* Buffer */}
        <td className="px-2 py-2 align-middle text-xs tabular-nums whitespace-nowrap">
          <PIDMetricTooltip
            rows={[
              {
                label: 'buffer_time',
                value:
                  bufferStats.buffer_time != null
                    ? formatPidBuffer(bufferStats.buffer_time)
                    : null,
              },
              {
                label: 'max_buffer_time',
                value:
                  bufferStats.max_buffer_time != null
                    ? formatPidBuffer(bufferStats.max_buffer_time)
                    : null,
              },
              {
                label: 'nb_buffer_units',
                value:
                  bufferStats.nb_buffer_units != null
                    ? formatNumber(bufferStats.nb_buffer_units)
                    : null,
              },
              {
                label: 'playout min',
                value:
                  bufferStats.min_playout_time != null
                    ? formatPidBuffer(bufferStats.min_playout_time)
                    : null,
              },
              {
                label: 'playout max',
                value:
                  bufferStats.max_playout_time != null
                    ? formatPidBuffer(bufferStats.max_playout_time)
                    : null,
              },
            ]}
          >
            <span className="cursor-default">
              <span className="text-info">
                {formatPidBuffer(bufferStats.buffer)}
              </span>
              {bufferStats.max_buffer != null && (
                <>
                  <span className="text-muted-foreground"> / </span>
                  <span className="text-info">
                    {formatPidBuffer(bufferStats.max_buffer)}
                  </span>
                </>
              )}
            </span>
          </PIDMetricTooltip>
        </td>

        {/* Bitrate · max_process_time */}
        <td className="px-2 py-2 align-middle text-xs tabular-nums">
          <PIDMetricTooltip
            rows={[
              {
                label: 'max_process_time',
                value: formatPidBuffer(perfStats.max_process_time),
                active: true,
              },
              {
                label: 'total_process_time',
                value:
                  perfStats.total_process_time > 0
                    ? formatPidBuffer(perfStats.total_process_time)
                    : null,
              },
              {
                label: 'nb_processed',
                value:
                  perfStats.nb_processed > 0
                    ? formatNumber(perfStats.nb_processed)
                    : null,
              },
            ]}
          >
            <span className="cursor-default">
              <span className="text-info">
                {formatPidBitrate(perfStats.bitrate)}
              </span>
              <span className="text-muted-foreground"> · </span>
              <span className="text-info">
                {formatPidBuffer(perfStats.max_process_time)}
              </span>
            </span>
          </PIDMetricTooltip>
        </td>

        {/* Proc. Rate */}
        <td className="px-2 py-2 align-middle text-xs tabular-nums">
          <PIDMetricTooltip
            rows={[
              {
                label: 'avg process rate',
                value: formatPidBitrate(perfStats.average_process_rate),
                active: true,
              },
              {
                label: 'max process rate',
                value: formatPidBitrate(perfStats.max_process_rate),
              },
            ]}
          >
            <span className="text-info cursor-default">
              {formatPidBitrate(perfStats.average_process_rate)}
            </span>
          </PIDMetricTooltip>
        </td>

        {/* TS + status */}
        <td className="px-2 py-2 align-middle">
          <div className="flex items-center gap-1">
            <PIDMetricTooltip
              rows={[
                {
                  label: 'last_ts_sent',
                  value: formatLastTsSent(perfStats.last_ts_sent),
                  active: true,
                },
                {
                  label: 'first_process_time',
                  value:
                    perfStats.first_process_time != null
                      ? formatPidBuffer(perfStats.first_process_time)
                      : null,
                },
                {
                  label: 'last_process_time',
                  value:
                    perfStats.last_process_time != null
                      ? formatPidBuffer(perfStats.last_process_time)
                      : null,
                },
              ]}
            >
              <span className="text-xs tabular-nums text-info font-mono cursor-default">
                {formatLastTsSent(perfStats.last_ts_sent)}
              </span>
            </PIDMetricTooltip>
            {statusBadge && (
              <Badge
                variant={statusBadge.variant}
                className="text-xs px-1 py-0 h-4 font-normal"
              >
                {statusBadge.text}
              </Badge>
            )}
          </div>
        </td>
      </tr>
    );
  },
);

PIDTableRow.displayName = 'PIDTableRow';

export default PIDTableRow;
