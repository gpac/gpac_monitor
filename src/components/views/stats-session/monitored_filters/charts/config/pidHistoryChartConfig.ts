import {
  formatBitrate,
  formatBufferTime,
  formatMicroseconds,
  formatPacketRate,
} from '@/utils/formatting';
import type { PIDMetricSample, PIDMetricMode } from '../../../types/pid';

export const MODE_FORMATTERS: Record<PIDMetricMode, (v: number) => string> = {
  bitrate: formatBitrate,
  bufferTime: formatBufferTime,
  processTime: formatMicroseconds,
  processRate: formatPacketRate,
  ts: formatMicroseconds,
};

export const extractValue = (
  sample: PIDMetricSample,
  mode: PIDMetricMode,
): number | null => {
  switch (mode) {
    case 'bitrate':
      return sample.averageBitrate ?? null;
    case 'bufferTime':
      return sample.bufferTime ?? null;
    case 'processTime':
      return sample.processTime ?? null;
    case 'processRate':
      return sample.processRate ?? null;
    case 'ts':
      return sample.ts ?? null;
  }
};
