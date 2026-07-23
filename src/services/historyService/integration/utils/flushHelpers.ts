export const MAX_LOGS_ON_SEEK = 500;
export const BADGE_WINDOW_US = 3_000_000;

export function filterRecentIndexes(
  timestamps: Map<number, number>,
  minUs: number,
): number[] {
  const result: number[] = [];
  for (const [index, tsUs] of timestamps) {
    if (tsUs >= minUs) result.push(index);
  }
  return result;
}
