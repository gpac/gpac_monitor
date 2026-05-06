import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import type { PIDproperties } from '@/types/domain/gpac/filter-stats';
import { GpacStreamType } from '@/types/domain/gpac/stream-types';
import { getStreamTypeBadgeConfig } from '@/utils/filters/streamType';
import { technicalDetailsFont } from '@/utils/responsiveFonts';
import { formatGpacFps } from '../../utils/pidProps';
import { formatSamplerate } from '../cards/media-info/formatters';

interface PIDInfosBlockProps {
  pid: PIDproperties;
}

const NA = '—';

const val = (value: string | number | null | undefined): string =>
  value != null && value !== '' ? String(value) : NA;

const formatResolution = (
  width: number | null | undefined,
  height: number | null | undefined,
): string => {
  if (width == null || height == null) return NA;
  return `${width}×${height}`;
};

const buildRows = (pid: PIDproperties): [string, string][] => {
  if (pid.type === GpacStreamType.Visual) {
    return [
      ['Codec', val(pid.codec)],
      ['Resolution', formatResolution(pid.width, pid.height)],
      ['FPS', formatGpacFps(pid.properties?.['FPS']?.value)],
      ['Pixel fmt', val(pid.pixelformat)],
    ];
  }
  if (pid.type === GpacStreamType.Audio) {
    return [
      ['Codec', val(pid.codec)],
      [
        'Sample rate',
        pid.samplerate != null ? formatSamplerate(pid.samplerate) : NA,
      ],
      ['Channels', val(pid.channels)],
    ];
  }
  if (pid.type === GpacStreamType.Text) {
    return [
      ['Codec', val(pid.codec)],
      ['Language', val(pid.language)],
    ];
  }
  return [
    ['Codec', val(pid.codec)],
    ['Type', val(pid.type)],
  ];
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-2">
    <span className="text-muted-foreground">{label}</span>
    <span
      className={`font-mono ${value === NA ? 'text-muted-foreground/40' : 'text-foreground'}`}
    >
      {value}
    </span>
  </div>
);

export const PIDInfosBlock = memo(({ pid }: PIDInfosBlockProps) => {
  const badgeConfig = getStreamTypeBadgeConfig(pid.type);
  const rows = buildRows(pid);

  return (
    <div className={`space-y-1 ${technicalDetailsFont}`}>
      <Badge
        variant="outline"
        className={`px-1.5 py-0 h-5 font-mono font-bold text-[10px] ${badgeConfig.className}`}
      >
        {badgeConfig.label}
      </Badge>
      <div className="space-y-0.5">
        {rows.map(([label, value]) => (
          <InfoRow key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  );
});

PIDInfosBlock.displayName = 'PIDInfosBlock';
