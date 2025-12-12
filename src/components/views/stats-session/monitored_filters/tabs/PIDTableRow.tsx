import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { formatBytes } from '@/utils/formatting';
import { getPIDStatusBadge, getMediaTypeInfo } from '@/utils/gpac';
import { FaCircleInfo } from 'react-icons/fa6';
import type { PIDWithIndex } from '../../types';
import {
  metricValueFont,
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

const PIDTableRow = memo(
  ({
    pid,
    filterIdx,
    onOpenProps,
    isEven,
    variant = 'input',
  }: PIDTableRowProps) => {
    const statusBadge = getPIDStatusBadge(pid);
    const type = (pid.type || 'Unknown').toLowerCase();
    const isVisual = type === 'visual' || type === 'video';
    const isAudio = type === 'audio';
    const mediaInfo = getMediaTypeInfo(type);

    // Resolution/Channels based on type
    const resOrCh =
      isVisual && pid.width && pid.height
        ? `${pid.width}×${pid.height}`
        : isAudio && pid.channels
          ? `${pid.channels}ch`
          : '—';

    const bgClass = isEven ? 'bg-black/10' : 'bg-black/20';
    const isOutput = variant === 'output';
    const displayName = isOutput ? pid.type || pid.name : pid.name;

    // Technical details for outputs
    const technicalDetails = isOutput
      ? [
          isVisual && pid.pixelformat ? pid.pixelformat.toUpperCase() : null,
          isAudio && pid.samplerate
            ? `${(pid.samplerate / 1000).toFixed(0)}kHz`
            : null,
        ]
          .filter(Boolean)
          .join(' ')
      : null;

    return (
      <tr
        className={`${bgClass} ${!isOutput ? 'hover:bg-black/30  cursor-pointer' : ''}`}
        onClick={
          !isOutput ? () => onOpenProps(filterIdx, pid.ipidIdx) : undefined
        }
      >
        <td className="px-2 py-1.5">
          {isOutput ? (
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={`${technicalDetailsFont} px-1.5 py-0 h-5 font-medium ${mediaInfo.color}`}
              >
                {mediaInfo.label}
              </Badge>
              {technicalDetails && (
                <span
                  className={`${formatIdentifierFont} text-muted-foreground font-mono`}
                >
                  {technicalDetails}
                </span>
              )}
            </div>
          ) : (
            <span
              className={`${metricValueFont} font-medium truncate max-w-[140px]`}
            >
              {displayName}
            </span>
          )}
        </td>
        <td
          className={`${formatIdentifierFont} px-2 py-1.5 text-muted-foreground uppercase`}
        >
          {pid.codec || '—'}
        </td>
        <td
          className={`${metricValueFont} px-2 py-1.5 text-muted-foreground tabular-nums`}
        >
          {formatBytes(pid.buffer)}
        </td>
        <td
          className={`${metricValueFont} px-2 py-1.5 text-info tabular-nums font-medium`}
        >
          {pid.bitrate || 0}
        </td>
        <td
          className={`${metricValueFont} px-2 py-1.5 text-muted-foreground tabular-nums`}
        >
          {resOrCh}
        </td>
        <td className="px-2 py-1.5">
          {statusBadge && (
            <Badge
              variant="secondary"
              className={`${technicalDetailsFont} px-1 py-0 h-4 font-normal`}
            >
              {statusBadge.text}
            </Badge>
          )}
        </td>
        {!isOutput && (
          <td className="px-2 py-1.5 text-right">
            <FaCircleInfo
              className="h-3 w-3 text-muted-foreground/50 hover:text-primary inline-block"
              title="View properties"
            />
          </td>
        )}
      </tr>
    );
  },
);

PIDTableRow.displayName = 'PIDTableRow';

export default PIDTableRow;
