import type { PIDWithIndex } from '../../../../types';
import {
  FILTER_LABELS,
  STREAM_TYPE_SHORT_LABEL,
  STREAM_TYPE_TO_FILTER,
} from '@/utils/filters/streamType';

const DIRECTION_LABEL = { input: 'Input', output: 'Output' } as const;

export function buildPIDPreviewHeading(
  pid: PIDWithIndex,
  variant: 'input' | 'output',
  filterType: string,
): { title: string; subtitle: string } {
  const mediaType = STREAM_TYPE_TO_FILTER[pid.type];
  const streamTypeLabel = mediaType ? FILTER_LABELS[mediaType] : pid.type;
  const resolution =
    pid.width && pid.height ? `${pid.width}×${pid.height}` : null;

  return {
    title: [
      filterType,
      DIRECTION_LABEL[variant],
      streamTypeLabel,
      `PID #${pid.pidIdx}`,
    ]
      .filter(Boolean)
      .join(' · '),
    subtitle: [pid.codec, resolution].filter(Boolean).join(' · '),
  };
}

export function buildPIDDisplayLabel(pid: PIDWithIndex): string {
  const pidIndex = pid.pidIdx ?? '?';
  const streamType =
    STREAM_TYPE_SHORT_LABEL[pid.type] ?? pid.type?.[0]?.toUpperCase() ?? '?';
  const codec = pid.codec?.toLowerCase() ?? pid.name ?? 'unknown';
  const resolution =
    pid.width && pid.height ? `${pid.width}×${pid.height}` : null;
  const sampleRate = pid.samplerate ? `${pid.samplerate / 1000} kHz` : null;

  return [`#${pidIndex}`, streamType, codec, resolution ?? sampleRate]
    .filter(Boolean)
    .join('·');
}
