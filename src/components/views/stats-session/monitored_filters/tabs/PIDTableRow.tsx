import { memo, useCallback } from 'react';
import { LuEye } from 'react-icons/lu';
import { Badge } from '@/components/ui/badge';
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
        {/* Type badge + eye button + infos */}
        <td className="px-2 py-2 align-middle text-xs">
          <div className="flex items-center gap-1.5">
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
            <span className="text-muted-foreground">{infoStats.infoLine}</span>
          </div>
        </td>
        {/* Bitrate · max_process_time */}
        <td className="px-2 py-2 align-middle text-xs tabular-nums whitespace-nowrap">
          <span className="text-info" title="bitrate">
            {formatPidBitrate(perfStats.bitrate)}
          </span>
          <span className="text-muted-foreground"> · </span>
          <span className="text-info" title="max_process_time (µs)">
            {formatPidBuffer(perfStats.max_process_time)}
          </span>
        </td>
        {/* buffer / max_buffer */}
        <td className="px-2 py-2 align-middle text-xs tabular-nums">
          <span className="text-info" title="buffer (µs)">
            {formatPidBuffer(bufferStats.buffer)}
          </span>
          {bufferStats.max_buffer != null && (
            <>
              <span className="text-muted-foreground"> / </span>
              <span className="text-info" title="max_buffer (µs)">
                {formatPidBuffer(bufferStats.max_buffer)}
              </span>
            </>
          )}
        </td>
        {/* last_ts_sent + status */}
        <td className="px-2 py-2 align-middle">
          <div className="flex items-center gap-1">
            <span
              className="text-xs tabular-nums text-info font-mono"
              title="last_ts_sent (s)"
            >
              {formatLastTsSent(perfStats.last_ts_sent)}
            </span>
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
