export interface MetricWithUnit {
  value: number;
  unit: string;
}

export interface LatencyMetric {
  value: number;
  unit: 'ms' | 's';
}

export interface ParsedMetrics {
  fps: number | null;
  latency: LatencyMetric | null;
}

// DEPRECATED: Use formatBytes from helper.ts instead
// This function is kept for backward compatibility but will be removed
export const bytesToHumanReadable = (bytes: number): string => {
  console.warn('bytesToHumanReadable is deprecated, use formatBytes from @/utils/helper instead');
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let currentSize = bytes;
  while (currentSize >= 1024 && unitIndex < units.length - 1) {
    currentSize /= 1024;
    unitIndex += 1;
  }
  return `${currentSize.toFixed(2)} ${units[unitIndex]}`;
};

export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export const getFormattedTime = (
  date: Date = new Date(),
  includeHour = true,
): string => {
  const options: Intl.DateTimeFormatOptions = {
    minute: '2-digit',
    second: '2-digit',
  };
  if (includeHour) {
    options.hour = '2-digit';
  }
  return date.toLocaleTimeString([], options);
};
