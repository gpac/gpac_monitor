export interface StatusMetricSample {
  sessionTimestampUs: number;
  value: number | null;
  time?: string;
}

export const buildStatusMetricKey = (
  filterIdx: number,
  metricKey: string,
): string => `${filterIdx}:${metricKey}`;
