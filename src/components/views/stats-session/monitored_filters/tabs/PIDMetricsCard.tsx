import { memo, useMemo } from 'react';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { formatBytes, formatBitrate } from '@/utils/formatting';
import { getMediaTypeInfo } from '@/utils/gpac';
import {
  getBorderColorForMediaType,
  getIconColorForMediaType,
} from '@/utils/filters/streamType';
import { LuEye } from 'react-icons/lu';
import type { PIDWithIndex } from '../../types';
import PIDMetadataBadges from './PIDMetadataBadges';
import {
  metricValueFont,
  metricLabelFont,
  technicalDetailsFont,
  headerFont,
  formatIdentifierFont,
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

const PIDMetricsCard = memo(
  ({
    pid,
    type,
    filterIdx,
    onOpenProps,
    showPropsButton = true,
    variant = 'input',
  }: PIDMetricsCardProps) => {
    const mediaInfo = useMemo(() => getMediaTypeInfo(type), [type]);
    const MediaIcon = mediaInfo.icon;
    const borderColor = useMemo(() => getBorderColorForMediaType(type), [type]);
    const iconColor = useMemo(() => getIconColorForMediaType(type), [type]);

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
        className={`bg-monitor-panel rounded-md border-l-2 ${borderColor} hover:bg-background/60 `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <MediaIcon className={`h-3.5 w-3.5 flex-shrink-0 ${iconColor}`} />
            <span
              className={`${formatIdentifierFont} text-muted-foreground`}
            ></span>
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
            {showPropsButton && variant === 'input' && (
              <button
                className="px-0.5 py-0.5 text-xs rounded bg-gray-700/50 border border-gray-600/50 text-gray-200 hover:bg-gray-700/80 flex items-center gap-1.5"
                onClick={() => onOpenProps(filterIdx, pid.ipidIdx)}
                title="View input properties"
              >
                <LuEye className="h-3.5 w-3.5" />
                <span className="font-cond">Props</span>
              </button>
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
