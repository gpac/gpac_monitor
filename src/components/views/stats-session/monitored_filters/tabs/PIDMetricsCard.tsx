import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { formatBytes, formatBitrate } from '@/utils/formatting';
import { getPIDStatusBadge, getMediaTypeInfo } from '@/utils/gpac';
import { FaCircleInfo } from 'react-icons/fa6';
import type { PIDWithIndex } from '../../types';
import PIDMetadataBadges from './PIDMetadataBadges';
import {
  metricValueFont,
  metricLabelFont,
  technicalDetailsFont,
  headerFont,
  formatIdentifierFont,
  badgeFont,
} from '@/utils/responsiveFonts';

type PIDCardVariant = 'input' | 'output';

interface PIDMetricsCardProps {
  pid: PIDWithIndex;
  type: string;
  filterIdx: number;
  onOpenProps: (filterIdx: number, ipidIdx: number) => void;
  showPropsButton?: boolean;
  variant?: PIDCardVariant;
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
  ({
    pid,
    type,
    filterIdx,
    onOpenProps,
    showPropsButton = true,
    variant = 'input',
  }: PIDMetricsCardProps) => {
    const statusBadge = getPIDStatusBadge(pid);
    const mediaInfo = getMediaTypeInfo(type);
    const MediaIcon = mediaInfo.icon;
    const borderColor = getBorderColor(type);

    // Format detection
    const t = type.toLowerCase();
    const isVisual = t === 'visual' || t === 'video';
    const isAudio = t === 'audio';

    // Has technical details?
    const hasTechnicalDetails =
      variant === 'output' &&
      (pid.id ||
        pid.trackNumber ||
        pid.timescale ||
        pid.stats?.max_process_time);

    return (
      <div
        className={`bg-monitor-panel rounded-md border-l-2 ${borderColor} hover:bg-background/60 transition-colors`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <MediaIcon
              className={`h-3.5 w-3.5 flex-shrink-0 ${mediaInfo.color}`}
            />
            <span className={`${headerFont} font-medium truncate`}>
              {pid.name}
            </span>
            {pid.codec && (
              <span
                className={`${formatIdentifierFont} text-muted-foreground uppercase`}
              >
                {pid.codec}
              </span>
            )}
            {/* Format info (Output only) */}
            {variant === 'output' && (
              <>
                {isVisual && pid.pixelformat && (
                  <span
                    className={`${formatIdentifierFont} text-muted-foreground font-mono uppercase`}
                  >
                    {pid.pixelformat}
                  </span>
                )}
                {isAudio && pid.samplerate && (
                  <span
                    className={`${formatIdentifierFont} text-muted-foreground font-mono`}
                  >
                    {(pid.samplerate / 1000).toFixed(0)}kHz
                  </span>
                )}
              </>
            )}
            <PIDMetadataBadges pid={pid} />
          </div>
          <div className="flex items-center gap-1.5">
            {statusBadge && (
              <Badge
                variant={statusBadge.variant}
                className={`${badgeFont} px-1.5 py-0 h-5`}
              >
                {statusBadge.text}
              </Badge>
            )}
            {showPropsButton && variant === 'input' && (
              <FaCircleInfo
                className="h-3.5 w-3.5 cursor-pointer text-muted-foreground hover:text-primary transition-colors"
                onClick={() => onOpenProps(filterIdx, pid.ipidIdx)}
                title="View input properties"
              />
            )}
          </div>
        </div>

        {/* KPIs - 4 columns for outputs, 3 for inputs */}
        <div
          className={`grid ${variant === 'output' ? 'grid-cols-4' : 'grid-cols-3'} gap-2 px-3 py-2 text-center`}
        >
          {variant === 'input' ? (
            <>
              <div>
                <div
                  className={`${metricValueFont} font-medium text-info tabular-nums`}
                >
                  {formatBytes(pid.buffer)}
                </div>
                <div className={`${metricLabelFont} text-muted-foreground`}>
                  Buffer
                </div>
              </div>
              <div>
                <div
                  className={`${metricValueFont} font-medium text-muted-foreground tabular-nums`}
                >
                  {pid.bitrate || 0}
                </div>
                <div className={`${metricLabelFont} text-muted-foreground`}>
                  Bitrate
                </div>
              </div>
              <div>
                <div
                  className={`${metricValueFont} font-medium text-info tabular-nums`}
                >
                  {pid.nb_pck_queued || 0}
                </div>
                <div className={`${metricLabelFont} text-muted-foreground`}>
                  Queued
                </div>
              </div>
            </>
          ) : (
            <>
              {/* 1. Packets traités */}
              <div>
                <div
                  className={`${metricValueFont} font-medium text-info tabular-nums`}
                >
                  {pid.stats?.nb_processed?.toLocaleString() || 0}
                </div>
                <div className={`${metricLabelFont} text-muted-foreground`}>
                  Packets
                </div>
              </div>

              {/* 2. Bitrate moyen */}
              <div>
                <div
                  className={`${metricValueFont} font-medium text-muted-foreground tabular-nums`}
                >
                  {formatBitrate(pid.stats?.average_bitrate)}
                </div>
                <div className={`${metricLabelFont} text-muted-foreground`}>
                  Bitrate
                </div>
              </div>

              {/* 3. Buffer / Queue */}
              <div>
                <div
                  className={`${metricValueFont} font-medium text-info tabular-nums`}
                >
                  {pid.nb_pck_queued ?? 0}
                </div>
                <div className={`${metricLabelFont} text-muted-foreground`}>
                  Queued
                </div>
              </div>

              {/* 4. Perf peak */}
              <div>
                <div
                  className={`${metricValueFont} font-medium text-warning tabular-nums`}
                >
                  {pid.stats?.max_process_time
                    ? `${pid.stats.max_process_time}µs`
                    : '-'}
                </div>
                <div className={`${metricLabelFont} text-muted-foreground`}>
                  Peak
                </div>
              </div>
            </>
          )}
        </div>

        {/* Technical Details - Accordion (Output only) */}
        {hasTechnicalDetails && (
          <div className="border-t border-white/5">
            <Accordion>
              <AccordionItem value="details" title="Technical Details">
                <div
                  className={`grid grid-cols-2 gap-x-4 gap-y-1 ${technicalDetailsFont} font-mono text-muted-foreground`}
                >
                  {pid.id && (
                    <div className="flex justify-between">
                      <span>ID:</span>
                      <span className="text-info">{pid.id}</span>
                    </div>
                  )}
                  {pid.trackNumber && (
                    <div className="flex justify-between">
                      <span>Track:</span>
                      <span className="text-info">{pid.trackNumber}</span>
                    </div>
                  )}
                  {pid.timescale && (
                    <div className="flex justify-between">
                      <span>Timescale:</span>
                      <span className="text-info">{pid.timescale}</span>
                    </div>
                  )}
                </div>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </div>
    );
  },
);

PIDMetricsCard.displayName = 'PIDMetricsCard';

export default PIDMetricsCard;
