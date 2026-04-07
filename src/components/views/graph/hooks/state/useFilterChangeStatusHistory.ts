import { useAppSelector } from '@/shared/hooks/redux';
import {
  selectPidReconfiguredCounts,
  selectArgUpdatedCounts,
} from '@/shared/store/selectors/graph/graphSelectors';

/**
 * History mode: badges persist as long as count > 0 in Redux.
 * No timeout — seek/hydrate resets the state naturally via clearGraph.
 */
export function useFilterChangeStatusHistory(filterIdx: number) {
  const key = filterIdx.toString();
  const showPidBadge =
    (useAppSelector(selectPidReconfiguredCounts)[key] ?? 0) > 0;
  const showArgBadge = (useAppSelector(selectArgUpdatedCounts)[key] ?? 0) > 0;

  return { showPidBadge, showArgBadge };
}
