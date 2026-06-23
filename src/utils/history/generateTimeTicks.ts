import { formatCompactTime } from '@/utils/formatting/time';

export interface TimeTick {
  positionPercent: number;
  label: string;
}

export interface TimeRuler {
  major: TimeTick[];
  minor: Array<{ positionPercent: number }>;
}

const US = 1_000_000;

const NICE_INTERVALS_US = [
  1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 21600, 43200,
  86400,
].map((seconds) => seconds * US);

const MAX_TICKS = 16;

export function generateTimeTicks(durationUs: number): TimeRuler {
  if (durationUs <= 0) return { major: [], minor: [] };

  const majorIntervalUs =
    NICE_INTERVALS_US.find(
      (candidate) => durationUs / candidate <= MAX_TICKS,
    ) ?? NICE_INTERVALS_US[NICE_INTERVALS_US.length - 1];

  const minorIntervalUs = majorIntervalUs / 5;
  const hasMinor = minorIntervalUs >= US;

  const major: TimeTick[] = [];
  for (let tickUs = 0; tickUs <= durationUs; tickUs += majorIntervalUs) {
    major.push({
      positionPercent: (tickUs / durationUs) * 100,
      label: formatCompactTime(tickUs),
    });
  }

  const minor: Array<{ positionPercent: number }> = [];
  if (hasMinor) {
    for (
      let tickUs = minorIntervalUs;
      tickUs < durationUs;
      tickUs += minorIntervalUs
    ) {
      if (tickUs % majorIntervalUs !== 0) {
        minor.push({ positionPercent: (tickUs / durationUs) * 100 });
      }
    }
  }

  return { major, minor };
}
