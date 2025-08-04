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

export function formatBytes(bytes: number): MetricWithUnit {
  if (bytes >= 1024 * 1024) {
    return {
      value: bytes / (1024 * 1024),
      unit: 'MB/s',
    };
  } else if (bytes >= 1024) {
    return {
      value: bytes / 1024,
      unit: 'KB/s',
    };
  } else {
    return {
      value: bytes,
      unit: 'bytes/s',
    };
  }
}

export function parseMetricsFromStatus(status: string): ParsedMetrics {
  const metrics: ParsedMetrics = {
    fps: null,
    latency: null,
  };

  const fpsMatch = status.match(/(\d+\.?\d*)\s*FPS/);
  if (fpsMatch) {
    metrics.fps = parseFloat(fpsMatch[1]);
  }

  const latencyMatch = status.match(/(\d+\.?\d*)\s*(ms|s)/);
  if (latencyMatch) {
    metrics.latency = {
      value: parseFloat(latencyMatch[1]),
      unit: latencyMatch[2] as 'ms' | 's',
    };
  }

  return metrics;
}

export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export const formatProcessingRate = formatBytes;
export const formatThroughputRate = formatBytes;
export const parseFilterStatus = parseMetricsFromStatus;
