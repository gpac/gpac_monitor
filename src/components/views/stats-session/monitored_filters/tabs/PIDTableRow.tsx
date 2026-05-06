import { memo, useCallback } from 'react';
import { LuEye } from 'react-icons/lu';
import { Badge } from '@/components/ui/badge';
import { GpacStreamType } from '@/types/domain/gpac/stream-types';
import { getPIDStatusBadge } from '@/utils/gpac';
import {
  formatPidBuffer,
  formatPidBitrate,
  formatPidCount,
} from '../../utils/pidFormatters';
import { formatGpacFps } from '../../utils/pidProps';
import { formatSamplerate } from '../cards/media-info/formatters';
import type { PIDWithIndex } from '../../types';
import {
  technicalDetailsFont,
  formatIdentifierFont,
} from '@/utils/responsiveFonts';

type PIDTableRowVariant = 'input' | 'output';

interface PIDTableRowProps {
  pid: PIDWithIndex;
  filterIdx: number;
  onOpenProps: (filterIdx: number, ipidIdx: number) => void;
  isEven: boolean;
  variant?: PIDTableRowVariant;
}

const TYPE_BADGE: Partial<
  Record<GpacStreamType, { label: string; className: string }>
> = {
  [GpacStreamType.Visual]: {
    label: 'V',
    className: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
  },
  [GpacStreamType.Audio]: {
    label: 'A',
    className: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
  },
  [GpacStreamType.Text]: {
    label: 'T',
    className: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
  },
  [GpacStreamType.Metadata]: {
    label: 'M',
    className: 'bg-purple-900/40 text-purple-300 border-purple-700/50',
  },
};

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

    const badgeConfig = TYPE_BADGE[pid.type] ?? {
      label: pid.type?.[0]?.toUpperCase() ?? '?',
      className: 'bg-gray-900/40 text-gray-400 border-gray-700/50',
    };
    const statusBadge = getPIDStatusBadge(pid);
    const bgClass = isEven ? 'bg-black/10' : 'bg-black/20';

    return (
      <tr className={`${bgClass} border-b border-white/5`}>
        {/* Type + eye button */}
        <td className="px-2 py-2 align-middle">
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
              className={`px-1.5 py-0 h-5 font-mono font-bold text-[10px] ${badgeConfig.className}`}
            >
              {badgeConfig.label}
            </Badge>
          </div>
        </td>
        {/* Infos compact */}
        <td
          className={`px-2 py-2 align-middle ${formatIdentifierFont} text-muted-foreground`}
        >
          {buildInfoLine(pid)}
        </td>
        {/* Metrics compact */}
        <td
          className={`px-2 py-2 align-middle ${formatIdentifierFont} tabular-nums`}
        >
          <span className="text-info">{formatPidBitrate(pid.bitrate)}</span>
          <span className="text-muted-foreground"> · </span>
          <span className="text-muted-foreground">
            {formatPidCount(pid.stats?.nb_processed)} pkt
          </span>
        </td>
        {/* Buffer */}
        <td
          className={`px-2 py-2 align-middle ${technicalDetailsFont} tabular-nums text-muted-foreground`}
        >
          {formatPidBuffer(pid.buffer)}
        </td>
        {/* Status */}
        <td className="px-2 py-2 align-middle">
          {statusBadge && (
            <Badge
              variant={statusBadge.variant}
              className={`${technicalDetailsFont} px-1 py-0 h-4 font-normal`}
            >
              {statusBadge.text}
            </Badge>
          )}
        </td>
      </tr>
    );
  },
);

PIDTableRow.displayName = 'PIDTableRow';

export default PIDTableRow;
