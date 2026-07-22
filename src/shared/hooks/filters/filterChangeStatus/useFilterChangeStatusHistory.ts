import { useAppSelector } from '@/shared/hooks/redux';

const NO_BADGE = { showPidBadge: false, showArgBadge: false } as const;

export function useFilterChangeStatusHistory(
  filterIdx: number,
  enabled: boolean,
) {
  const key = filterIdx.toString();
  const showPidBadge = useAppSelector(
    (state) => (state.graph.pidReconfiguredCounts[key] ?? 0) > 0,
  );
  const showArgBadge = useAppSelector(
    (state) => (state.graph.argUpdatedCounts[key] ?? 0) > 0,
  );

  if (!enabled) return NO_BADGE;
  return { showPidBadge, showArgBadge };
}
