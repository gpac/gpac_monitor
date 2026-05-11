import { memo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/utils/formatting';
import { getPIDStatusBadge } from '@/utils/gpac';
import {
  formatPidBuffer,
  formatPidBitrate,
  formatLastTsSent,
} from '../../utils/pidFormatters';
import { buildPIDKey } from '../../types/pid';
import type { PIDWithIndex } from '../../types';
import { PID_SELECTION_COLORS } from '../../utils/pidColors';
import { usePIDInfoStats } from './hooks/usePIDInfoStats';
import { usePIDBufferStats } from './hooks/usePIDBufferStats';
import { usePIDPerformanceStats } from './hooks/usePIDPerformanceStats';
import PIDMetricTooltip from './PIDMetricTooltip';
import PIDRowInfoCell from './PIDRowInfoCell';
import { useAppSelector } from '@/shared/hooks/redux';
import { selectPidColorIndexByKey } from '@/shared/store/selectors';

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

    const statusBadge = getPIDStatusBadge(pid);
    const bgClass = isEven ? 'bg-black/10' : 'bg-black/20';

    const pidKey = buildPIDKey(filterIdx, variant, pid.ipidIdx);
    const colorIndex = useAppSelector(
      (state) => selectPidColorIndexByKey(state)[pidKey] ?? -1,
    );
    const isSelected = colorIndex >= 0;

    const borderStyle = isSelected
      ? { borderLeft: `3px solid ${PID_SELECTION_COLORS[colorIndex]}` }
      : { borderLeft: '3px solid transparent' };

    return (
      <tr
        className={`${bgClass} border-b border-white/5`}
        style={borderStyle}
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

        {/* Bitrate */}
        <td className="px-2 py-2 align-middle text-xs tabular-nums">
          <PIDMetricTooltip
            rows={[
              {
                label: 'average_bitrate',
                value: formatPidBitrate(perfStats.average_bitrate),
              },
              {
                label: 'max_bitrate',
                value: formatPidBitrate(perfStats.max_bitrate),
              },
            ]}
          >
            <span className="text-info cursor-default">
              {formatPidBitrate(perfStats.bitrate)}
            </span>
          </PIDMetricTooltip>
        </td>

        {/* Proc. */}
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
            <span className="text-info cursor-default">
              {formatPidBuffer(perfStats.max_process_time)}
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
