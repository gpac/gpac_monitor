import {
  formatBitrate,
  formatBufferTime,
  formatMicroseconds,
  formatPacketRate,
} from '@/utils/formatting';
import type { PIDMetricSample, PIDMetricMode } from '../../../types/pid';

export interface PIDMetricDef {
  key: PIDMetricMode;
  group: string;
  label: string;
  extract: (sample: PIDMetricSample) => number | null;
  format: (value: number) => string;
}

export const PID_METRICS: PIDMetricDef[] = [
  // Buffer group
  {
    key: 'bufferTime',
    group: 'bufferTime',
    label: 'Buffer',
    extract: (s) => s.bufferTime ?? null,
    format: formatBufferTime,
  },
  {
    key: 'buffer',
    group: 'bufferTime',
    label: 'Buffer (raw)',
    extract: (s) => s.buffer ?? null,
    format: formatBufferTime,
  },
  // Bitrate group
  {
    key: 'bitrate',
    group: 'bitrate',
    label: 'Avg Bitrate',
    extract: (s) => s.averageBitrate ?? null,
    format: formatBitrate,
  },
  // Process time group
  {
    key: 'processTime',
    group: 'processTime',
    label: 'Proc.',
    extract: (s) => s.processTime ?? null,
    format: formatMicroseconds,
  },
  // Process rate group
  {
    key: 'processRate',
    group: 'processRate',
    label: 'Proc. Rate',
    extract: (s) => s.processRate ?? null,
    format: formatPacketRate,
  },
  // Last proc group
  {
    key: 'ts',
    group: 'ts',
    label: 'Last Proc.',
    extract: (s) => s.ts ?? null,
    format: formatMicroseconds,
  },
  {
    key: 'lastTsSent',
    group: 'ts',
    label: 'Last TS Sent',
    extract: (s) => s.lastTsSent ?? null,
    format: (value) => `${value.toFixed(2)}s`,
  },
];

export const PID_METRIC_GROUPS: PIDMetricDef[] = PID_METRICS.filter(
  (def) => def.group === def.key,
);

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
