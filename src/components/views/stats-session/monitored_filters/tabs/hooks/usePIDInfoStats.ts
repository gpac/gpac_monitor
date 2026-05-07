import { useMemo } from 'react';
import type { PIDproperties } from '@/types/domain/gpac/filter-stats';
import { GpacStreamType } from '@/types/domain/gpac/stream-types';
import { formatGpacFps } from '../../../utils/pidProps';
import { formatSamplerate } from '../../cards/media-info/formatters';

export interface PIDInfoStats {
  codec: string | null;
  type: GpacStreamType;
  // Visual — field names match PIDproperties
  width: number | null;
  height: number | null;
  pixelformat: string | null;
  fps: string; // formatted from pid.properties['FPS']
  // Audio
  samplerate: number | null;
  channels: number | null;
  // Text
  language: string | null;
  // Compact one-line summary for table display
  infoLine: string;
}

const buildInfoLine = (pid: PIDproperties, fps: string): string => {
  const parts: string[] = [];
  if (pid.codec) parts.push(pid.codec.toLowerCase());

  if (pid.type === GpacStreamType.Visual) {
    if (pid.width && pid.height) parts.push(`${pid.width}×${pid.height}`);
    if (fps !== '—') parts.push(fps);
  } else if (pid.type === GpacStreamType.Audio) {
    if (pid.samplerate != null) parts.push(formatSamplerate(pid.samplerate));
    if (pid.channels) parts.push(`${pid.channels} ch`);
  } else if (pid.type === GpacStreamType.Text && pid.language) {
    parts.push(pid.language);
  }

  return parts.join(' · ') || '—';
};

export const usePIDInfoStats = (pid: PIDproperties): PIDInfoStats => {
  return useMemo(() => {
    const fps = formatGpacFps(pid.properties?.['FPS']?.value);

    return {
      codec: pid.codec || null,
      type: pid.type,
      width: pid.width,
      height: pid.height,
      pixelformat: pid.pixelformat,
      fps,
      samplerate: pid.samplerate,
      channels: pid.channels,
      language: pid.language ?? null,
      infoLine: buildInfoLine(pid, fps),
    };
  }, [
    pid.codec,
    pid.type,
    pid.width,
    pid.height,
    pid.pixelformat,
    pid.properties,
    pid.samplerate,
    pid.channels,
    pid.language,
  ]);
};
