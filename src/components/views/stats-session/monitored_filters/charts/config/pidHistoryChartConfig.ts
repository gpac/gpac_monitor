import {
  formatBitrate,
  formatBufferTime,
  formatMicroseconds,
  formatPacketRate,
} from '@/utils/formatting';
import type { PIDMetricSample, PIDMetricMode } from '../../../types/pid';

export interface PIDMetricDef {
  key: PIDMetricMode;
  label: string;
  extract: (sample: PIDMetricSample) => number | null;
  format: (value: number) => string;
}

export const PID_METRICS: PIDMetricDef[] = [
  {
    key: 'bufferTime',
    label: 'Buffer',
    extract: (sample) => sample.bufferTime ?? null,
    format: formatBufferTime,
  },
  {
    key: 'bitrate',
    label: 'Avg Bitrate',
    extract: (sample) => sample.averageBitrate ?? null,
    format: formatBitrate,
  },
  {
    key: 'processTime',
    label: 'Proc.',
    extract: (sample) => sample.processTime ?? null,
    format: formatMicroseconds,
  },
  {
    key: 'processRate',
    label: 'Proc. Rate',
    extract: (sample) => sample.processRate ?? null,
    format: formatPacketRate,
  },
  {
    key: 'ts',
    label: 'Last Proc.',
    extract: (sample) => sample.ts ?? null,
    format: formatMicroseconds,
  },
];

export const PID_METRICS_BY_KEY: Record<PIDMetricMode, PIDMetricDef> =
  Object.fromEntries(PID_METRICS.map((def) => [def.key, def])) as Record<
    PIDMetricMode,
    PIDMetricDef
  >;

export const MODE_FORMATTERS: Record<PIDMetricMode, (v: number) => string> =
  Object.fromEntries(PID_METRICS.map((def) => [def.key, def.format])) as Record<
    PIDMetricMode,
    (v: number) => string
  >;

export const extractValue = (
  sample: PIDMetricSample,
  mode: PIDMetricMode,
): number | null => PID_METRICS_BY_KEY[mode].extract(sample);
