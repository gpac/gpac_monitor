import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/shared/hooks/redux';
import {
  selectPidReconfiguredFilters,
  selectArgUpdatedFilters,
} from '@/shared/store/selectors/graph/graphSelectors';
import {
  clearPidReconfigured,
  clearArgUpdated,
} from '@/shared/store/slices/graphSlice';

const FLASH_DURATION_MS = 4000;

export function useFilterChangeStatus(filterIdx: number) {
  const dispatch = useAppDispatch();
  const key = filterIdx.toString();
  const isPidReconfigured = useAppSelector(
    (state) => selectPidReconfiguredFilters(state).includes(key),
  );
  const isArgUpdated = useAppSelector(
    (state) => selectArgUpdatedFilters(state).includes(key),
  );

  const [showPidBadge, setShowPidBadge] = useState(false);
  const [showArgBadge, setShowArgBadge] = useState(false);

  useEffect(() => {
    if (!isPidReconfigured) return;
    setShowPidBadge(true);
    const timer = setTimeout(() => {
      setShowPidBadge(false);
      dispatch(clearPidReconfigured(filterIdx));
    }, FLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [isPidReconfigured, filterIdx, dispatch]);

  useEffect(() => {
    if (!isArgUpdated) return;
    setShowArgBadge(true);
    const timer = setTimeout(() => {
      setShowArgBadge(false);
      dispatch(clearArgUpdated(filterIdx));
    }, FLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [isArgUpdated, filterIdx, dispatch]);

  return { showPidBadge, showArgBadge };
}
