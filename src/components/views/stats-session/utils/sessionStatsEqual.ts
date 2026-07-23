import type { SessionFilterStatistics } from '@/types/domain/gpac/filter-stats';

export const sessionFilterStatEqual = (
  prev: SessionFilterStatistics,
  next: SessionFilterStatistics,
): boolean =>
  prev.idx === next.idx &&
  prev.status === next.status &&
  prev.bytes_done === next.bytes_done &&
  prev.bytes_sent === next.bytes_sent &&
  prev.pck_sent === next.pck_sent &&
  prev.pck_done === next.pck_done &&
  prev.time === next.time &&
  prev.nb_ipid === next.nb_ipid &&
  prev.nb_opid === next.nb_opid &&
  (prev.is_eos ?? false) === (next.is_eos ?? false);

/**
 * True when two session stats snapshots carry the same UI-visible values.
 * Used to skip a setState when GPAC re-sends an identical payload.
 */
export const sessionStatsEqual = (
  prev: SessionFilterStatistics[],
  next: SessionFilterStatistics[],
): boolean => {
  if (prev === next) return true;
  if (prev.length !== next.length) return false;

  return prev.every((stat, index) => sessionFilterStatEqual(stat, next[index]));
};
