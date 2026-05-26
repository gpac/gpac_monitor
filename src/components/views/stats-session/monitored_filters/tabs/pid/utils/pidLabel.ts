import type { PIDWithIndex } from '../../../../types';
import { STREAM_TYPE_SHORT_LABEL } from '@/utils/filters/streamType';

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
