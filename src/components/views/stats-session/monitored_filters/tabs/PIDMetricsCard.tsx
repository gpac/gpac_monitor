import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { formatBytes } from '@/utils/formatting';
import { getPIDStatusBadge, getMediaTypeInfo } from '@/utils/gpac';
import { FaCircleInfo } from 'react-icons/fa6';
import type { PIDWithIndex } from '../../types';

interface PIDMetricsCardProps {
  pid: PIDWithIndex;
  type: string;
  filterIdx: number;
  onOpenProps: (filterIdx: number, ipidIdx: number) => void;
}

// Border color by media type
const getBorderColor = (type: string): string => {
  const t = type.toLowerCase();
  if (t === 'visual' || t === 'video') return 'border-l-blue-500/60';
  if (t === 'audio') return 'border-l-emerald-500/60';
  if (t === 'text') return 'border-l-amber-500/60';
  return 'border-l-slate-500/60';
};

const PIDMetricsCard = memo(
  ({ pid, type, filterIdx, onOpenProps }: PIDMetricsCardProps) => {
    const statusBadge = getPIDStatusBadge(pid);
    const mediaInfo = getMediaTypeInfo(type);
    const MediaIcon = mediaInfo.icon;
    const borderColor = getBorderColor(type);

    // Third metric based on type
    const t = type.toLowerCase();
    const isVisual = t === 'visual' || t === 'video';
    const isAudio = t === 'audio';
    const thirdValue =
      isVisual && pid.width && pid.height
        ? `${pid.width}x${pid.height}`
        : isAudio && pid.channels
          ? `${pid.channels}ch`
          : pid.nb_pck_queued || 0;
    const thirdLabel =
      isVisual && pid.width ? 'Res' : isAudio ? 'Ch' : 'Queued';

    return (
      <div
        className={`bg-stat rounded-md border-l-2 ${borderColor} hover:bg-background/60 transition-colors`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <MediaIcon
              className={`h-3.5 w-3.5 flex-shrink-0 ${mediaInfo.color}`}
            />
            <span className="text-sm font-medium truncate">{pid.name}</span>
            {pid.codec && (
              <span className="text-[10px] text-muted-foreground uppercase">
                {pid.codec}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {statusBadge && (
              <Badge
                variant={statusBadge.variant}
                className="text-[10px] px-1.5 py-0 h-5"
              >
                {statusBadge.text}
              </Badge>
            )}
            <FaCircleInfo
              className="h-3.5 w-3.5 cursor-pointer text-muted-foreground hover:text-primary transition-colors"
              onClick={() => onOpenProps(filterIdx, pid.ipidIdx)}
              title="View properties"
            />
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-2 px-3 py-2 text-center">
          <div>
            <div className="text-xs font-medium text-info tabular-nums">
              {formatBytes(pid.buffer)}
            </div>
            <div className="text-[10px] text-muted-foreground">Buffer</div>
          </div>
          <div>
            <div className="text-xs font-medium text-info tabular-nums">
              {pid.bitrate || 0}
            </div>
            <div className="text-[10px] text-muted-foreground">Bitrate</div>
          </div>
          <div>
            <div className="text-xs font-medium text-info tabular-nums">
              {thirdValue}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {thirdLabel}
            </div>
          </div>
        </div>

        {/* Audio sample rate */}
        {isAudio && pid.samplerate && (
          <div className="px-3 pb-2 text-center">
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {(pid.samplerate / 1000).toFixed(1)} kHz
            </span>
          </div>
        )}
      </div>
    );
  },
);

PIDMetricsCard.displayName = 'PIDMetricsCard';

export default PIDMetricsCard;
