export interface StatusMetricSample {
  sessionTimestampUs: number;
  value: number | null;
}

export const buildStatusMetricKey = (
  filterIdx: number,
  metricKey: string,
): string => `${filterIdx}:${metricKey}`;
