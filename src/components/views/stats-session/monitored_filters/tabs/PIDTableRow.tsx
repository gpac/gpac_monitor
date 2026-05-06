import { memo, useCallback } from 'react';
import { LuEye } from 'react-icons/lu';
import { Badge } from '@/components/ui/badge';
import { GpacStreamType } from '@/types/domain/gpac/stream-types';
import { getPIDStatusBadge } from '@/utils/gpac';
import { getStreamTypeBadgeConfig } from '@/utils/filters/streamType';
import {
  formatPidBuffer,
  formatPidBitrate,
  formatLastTsSent,
} from '../../utils/pidFormatters';
import { formatGpacFps } from '../../utils/pidProps';
import { formatSamplerate } from '../cards/media-info/formatters';
import type { PIDWithIndex } from '../../types';

type PIDTableRowVariant = 'input' | 'output';

interface PIDTableRowProps {
  pid: PIDWithIndex;
  filterIdx: number;
  onOpenProps: (filterIdx: number, ipidIdx: number) => void;
  isEven: boolean;
  variant?: PIDTableRowVariant;
}

const buildInfoLine = (pid: PIDWithIndex): string => {
  const parts: string[] = [];
  if (pid.codec) parts.push(pid.codec.toLowerCase());

  if (pid.type === GpacStreamType.Visual) {
    if (pid.width && pid.height) parts.push(`${pid.width}×${pid.height}`);
    const fps = formatGpacFps(pid.properties?.['FPS']?.value);
    if (fps !== '—') parts.push(fps);
  } else if (pid.type === GpacStreamType.Audio) {
    if (pid.samplerate != null) parts.push(formatSamplerate(pid.samplerate));
    if (pid.channels) parts.push(`${pid.channels} ch`);
  } else if (pid.type === GpacStreamType.Text && pid.language) {
    parts.push(pid.language);
  }

  return parts.join(' · ') || '—';
};

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
            <span className="text-muted-foreground">{buildInfoLine(pid)}</span>
          </div>
        </td>
        {/* Rate / Peak */}
        <td className="px-2 py-2 align-middle text-xs tabular-nums whitespace-nowrap">
          <span className="text-info" title="Bitrate">
            {formatPidBitrate(pid.bitrate)}
          </span>
          <span className="text-muted-foreground"> · </span>
          <span className="text-info" title="max_process_time (µs)">
            {formatPidBuffer(pid.stats?.max_process_time)}
          </span>
        </td>
        {/* Buffer: fill / max */}
        <td className="px-2 py-2 align-middle text-xs tabular-nums">
          <span className="text-info" title="buffer (µs)">
            {formatPidBuffer(pid.buffer)}
          </span>
          {pid.max_buffer != null && (
            <>
              <span className="text-muted-foreground"> / </span>
              <span className="text-info" title="max_buffer (µs)">
                {formatPidBuffer(pid.max_buffer)}
              </span>
            </>
          )}
        </td>
        {/* TS / Stat */}
        <td className="px-2 py-2 align-middle">
          <div className="flex items-center gap-1">
            <span
              className="text-xs tabular-nums text-info font-mono"
              title="last_ts_sent (s)"
            >
              {formatLastTsSent(pid.stats?.last_ts_sent)}
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
