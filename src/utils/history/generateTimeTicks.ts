import { formatCompactTime } from '@/utils/formatting/time';

export interface TimeTick {
  positionPercent: number;
  label: string;
}

const US = 1_000_000;

const NICE_INTERVALS_US = [
  1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 21600, 43200,
  86400,
].map((seconds) => seconds * US);

const MAX_TICKS = 8;

export function generateTimeTicks(durationUs: number): TimeTick[] {
  if (durationUs <= 0) return [];

  const intervalUs =
    NICE_INTERVALS_US.find(
      (candidate) => durationUs / candidate <= MAX_TICKS,
    ) ?? NICE_INTERVALS_US[NICE_INTERVALS_US.length - 1];

  const ticks: TimeTick[] = [];
  for (let tickUs = 0; tickUs <= durationUs; tickUs += intervalUs) {
    ticks.push({
      positionPercent: (tickUs / durationUs) * 100,
      label: formatCompactTime(tickUs),
    });
  }
  return ticks;
}
