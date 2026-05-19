import { memo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  formatNumber,
  formatMicroseconds,
  formatBps,
  formatLastTsSent,
} from '@/utils/formatting';
import { getPIDStatusBadge } from '@/utils/gpac';
import { buildPIDKey } from '../../../types/pid';
import type { PIDWithIndex } from '../../../types';
import { PID_SELECTION_COLORS } from './utils/pidColors';
import { usePIDInfoStats } from '../hooks/usePIDInfoStats';
import { usePIDBufferStats } from '../hooks/usePIDBufferStats';
import { usePIDPerformanceStats } from '../hooks/usePIDPerformanceStats';
import { usePIDSample } from '../hooks/usePIDSample';
import PIDMetricTooltip from './PIDMetricTooltip';
import PIDRowInfoCell from './PIDRowInfoCell';
import { useAppSelector } from '@/shared/hooks/redux';
import { selectPidColorIndexByKey } from '@/shared/store/selectors';
import { cn } from '@/utils/core';

type PIDTableRowVariant = 'input' | 'output';

interface PIDTableRowProps {
  pid: PIDWithIndex;
  filterIdx: number;
  onOpenProps: (filterIdx: number, pidIdx: number) => void;
  isEven: boolean;
  variant?: PIDTableRowVariant;
  hoveredPidKey?: string | null;
}

const PIDTableRow = memo(
  ({
    pid,
    filterIdx,
    onOpenProps,
    isEven,
    variant = 'input',
    hoveredPidKey = null,
  }: PIDTableRowProps) => {
    const handleOpenProps = useCallback(
      () => onOpenProps(filterIdx, pid.pidIdx),
      [onOpenProps, filterIdx, pid.pidIdx],
    );

    const infoStats = usePIDInfoStats(pid);
    const bufferStats = usePIDBufferStats(pid);
    const perfStats = usePIDPerformanceStats(pid);

    const statusBadge = getPIDStatusBadge(pid);
    const bgClass = isEven ? 'bg-black/10' : 'bg-black/20';

    const pidKey = buildPIDKey(filterIdx, variant, pid.pidIdx);
    usePIDSample(pidKey, {
      averageBitrate: perfStats.average_bitrate,
      bufferTime: bufferStats.displayBuffer,
      processTime: perfStats.average_process_time,
      processRate: perfStats.average_process_rate,
    });
    const colorIndex = useAppSelector(
      (state) => selectPidColorIndexByKey(state)[pidKey] ?? -1,
    );
    const isSelected = colorIndex >= 0;

    const rowStyle = isSelected
      ? {
          borderLeft: `3px solid ${PID_SELECTION_COLORS[colorIndex]}`,
          background: `${PID_SELECTION_COLORS[colorIndex]}12`,
        }
      : { borderLeft: '3px solid transparent' };

    return (
      <tr
        className={cn(
          !isSelected && bgClass,
          'border-b border-white/5',
          pidKey === hoveredPidKey && 'pid-row-hovered',
        )}
        style={rowStyle}
        data-pid-key={pidKey}
      >
        {/* Infos */}
        <td className="px-2 py-2 align-middle text-xs">
          <PIDRowInfoCell
            pid={pid}
            filterIdx={filterIdx}
            variant={variant}
            pidKey={pidKey}
            infoLine={infoStats.infoLine}
            onOpenProps={handleOpenProps}
          />
        </td>

        {/* Buffer */}
        <td className="px-2 py-2 align-middle text-xs tabular-nums whitespace-nowrap">
          <PIDMetricTooltip
            rows={[
              {
                label: 'buffer_time',
                value:
                  bufferStats.buffer_time != null
                    ? formatMicroseconds(bufferStats.buffer_time)
                    : null,
                active: bufferStats.buffer_time != null,
              },
              {
                label: 'buffer',
                value: formatMicroseconds(bufferStats.buffer),
                active: bufferStats.buffer_time == null,
              },
              {
                label: 'max_buffer',
                value:
                  bufferStats.max_buffer != null
                    ? formatMicroseconds(bufferStats.max_buffer)
                    : null,
              },
              {
                label: 'max_buffer_time',
                value:
                  bufferStats.max_buffer_time != null
                    ? formatMicroseconds(bufferStats.max_buffer_time)
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
                    ? formatMicroseconds(bufferStats.min_playout_time)
                    : null,
              },
              {
                label: 'playout max',
                value:
                  bufferStats.max_playout_time != null
                    ? formatMicroseconds(bufferStats.max_playout_time)
                    : null,
              },
            ]}
          >
            <span className="cursor-default">
              <span className="text-info">
                {formatMicroseconds(bufferStats.displayBuffer)}
              </span>
              {bufferStats.max_buffer != null && (
                <>
                  <span className="text-muted-foreground"> / </span>
                  <span className="text-info">
                    {formatMicroseconds(bufferStats.max_buffer)}
                  </span>
                </>
              )}
            </span>
          </PIDMetricTooltip>
        </td>

        {/* Bitrate */}
        <td className="px-2 py-2 align-middle text-xs tabular-nums">
          <PIDMetricTooltip
            rows={[
              {
                label: 'average_bitrate',
                value: formatBps(perfStats.average_bitrate),
                active: true,
              },
              {
                label: 'bitrate',
                value: formatBps(perfStats.bitrate),
              },
              {
                label: 'max_bitrate',
                value: formatBps(perfStats.max_bitrate),
              },
            ]}
          >
            <span className="text-info cursor-default">
              {formatBps(perfStats.average_bitrate)}
            </span>
          </PIDMetricTooltip>
        </td>

        {/* Proc. */}
        <td className="px-2 py-2 align-middle text-xs tabular-nums">
          <PIDMetricTooltip
            rows={[
              {
                label: 'avg_process_time',
                value:
                  perfStats.average_process_time != null
                    ? formatMicroseconds(perfStats.average_process_time)
                    : null,
                active: true,
              },
              {
                label: 'max_process_time',
                value: formatMicroseconds(perfStats.max_process_time),
              },
              {
                label: 'total_process_time',
                value:
                  perfStats.total_process_time > 0
                    ? formatMicroseconds(perfStats.total_process_time)
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
            <span className="text-info cursor-default">
              {perfStats.average_process_time != null
                ? formatMicroseconds(perfStats.average_process_time)
                : '—'}
            </span>
          </PIDMetricTooltip>
        </td>

        {/* Proc. Rate */}
        <td className="px-2 py-2 align-middle text-xs tabular-nums">
          <PIDMetricTooltip
            rows={[
              {
                label: 'avg process rate',
                value: formatBps(perfStats.average_process_rate),
                active: true,
              },
              {
                label: 'max process rate',
                value: formatBps(perfStats.max_process_rate),
              },
            ]}
          >
            <span className="text-info cursor-default">
              {formatBps(perfStats.average_process_rate)}
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
                      ? formatMicroseconds(perfStats.first_process_time)
                      : null,
                },
                {
                  label: 'last_process_time',
                  value:
                    perfStats.last_process_time != null
                      ? formatMicroseconds(perfStats.last_process_time)
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
