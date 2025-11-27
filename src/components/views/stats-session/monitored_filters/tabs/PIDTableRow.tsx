import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { formatBytes } from '@/utils/formatting';
import { getPIDStatusBadge } from '@/utils/gpac';
import { FaCircleInfo } from 'react-icons/fa6';
import type { PIDWithIndex } from '../../types';
import {
  metricValueFont,
  technicalDetailsFont,
  formatIdentifierFont,
} from '@/utils/responsiveFonts';

interface PIDTableRowProps {
  pid: PIDWithIndex;
  filterIdx: number;
  onOpenProps: (filterIdx: number, ipidIdx: number) => void;
  isEven: boolean;
}

const PIDTableRow = memo(
  ({ pid, filterIdx, onOpenProps, isEven }: PIDTableRowProps) => {
    const statusBadge = getPIDStatusBadge(pid);
    const type = (pid.type || 'Unknown').toLowerCase();
    const isVisual = type === 'visual' || type === 'video';
    const isAudio = type === 'audio';

    // Resolution/Channels based on type
    const resOrCh =
      isVisual && pid.width && pid.height
        ? `${pid.width}×${pid.height}`
        : isAudio && pid.channels
          ? `${pid.channels}ch`
          : '—';

    const bgClass = isEven ? 'bg-black/10' : 'bg-black/20';

    return (
      <tr
        className={`${bgClass} hover:bg-black/30 transition-colors cursor-pointer`}
        onClick={() => onOpenProps(filterIdx, pid.ipidIdx)}
      >
        <td
          className={`${metricValueFont} px-2 py-1.5 font-medium truncate max-w-[140px]`}
        >
          {pid.name}
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
        <td className="px-2 py-1.5 text-right">
          <FaCircleInfo
            className="h-3 w-3 text-muted-foreground/50 hover:text-primary inline-block"
            title="View properties"
          />
        </td>
      </tr>
    );
  },
);

PIDTableRow.displayName = 'PIDTableRow';

export default PIDTableRow;
