export type SessionTimeUs = number;

export interface StatusMetricSample {
  sessionTimeUs: number;
  value: number | null;
}

export const buildStatusMetricKey = (
  filterIdx: number,
  metricKey: string,
): string => `${filterIdx}:${metricKey}`;
