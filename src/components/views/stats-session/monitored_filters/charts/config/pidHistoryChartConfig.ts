import type uPlot from 'uplot';
import {
  formatBitrate,
  formatBufferTime,
  formatMicroseconds,
  formatPacketRate,
} from '@/utils/formatting';
import { formatChartTimeFromUs } from '@/utils/formatting/time';
import type { PIDMetricSample, PIDMetricMode } from '../../../types/pid';

type AlignableEntry = { pidHistory: PIDMetricSample[] };

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

export const CHART_HEIGHT = 140;

// Builds uPlot-compatible aligned data: all series share a common integer x-axis,
// shorter series are null-padded on the left to align with the longest.
export const buildUplotAlignedData = (
  entries: AlignableEntry[],
  mode: PIDMetricMode,
): { alignedData: uPlot.AlignedData; timeLabels: string[] } => {
  const maxLen = entries.reduce(
    (acc, entry) => Math.max(acc, entry.pidHistory.length),
    0,
  );
  if (maxLen === 0) {
    return {
      alignedData: [[0], ...entries.map(() => [null])] as uPlot.AlignedData,
      timeLabels: [],
    };
  }

  const indices = Array.from({ length: maxLen }, (_, i) => i);
  // uPlot x-axis labels come from the entry with the most samples
  const timeReferenceEntry = entries.reduce(
    (acc, entry) =>
      entry.pidHistory.length >= acc.pidHistory.length ? entry : acc,
    entries[0],
  );
  const timeLabels = timeReferenceEntry.pidHistory.map(
    (sample) => sample.time ?? formatChartTimeFromUs(sample.sessionTimestampUs),
  );

  const valueCols = entries.map((entry) => {
    const offset = maxLen - entry.pidHistory.length;
    return indices.map((i) => {
      const j = i - offset;
      return j < 0 ? null : extractValue(entry.pidHistory[j], mode);
    });
  });

  return {
    alignedData: [indices, ...valueCols] as uPlot.AlignedData,
    timeLabels,
  };
};
