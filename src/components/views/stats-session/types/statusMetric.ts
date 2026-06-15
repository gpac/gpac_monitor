export interface StatusMetricSample {
  sessionTimestampUs: number;
  value: number | null;
  time?: string;
}

export interface GraphableStatusMetric {
  key: string;
  rawValue: number | null;
}

export const buildStatusMetricKey = (
  filterIdx: number,
  metricKey: string,
): string => `${filterIdx}:${metricKey}`;
