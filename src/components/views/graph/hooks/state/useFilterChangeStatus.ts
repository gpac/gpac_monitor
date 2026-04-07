import { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@/shared/hooks/redux';
import {
  selectPidReconfiguredFilters,
  selectArgUpdatedFilters,
} from '@/shared/store/selectors/graph/graphSelectors';
import {
  clearPidReconfigured,
  clearArgUpdated,
} from '@/shared/store/slices/graphSlice';

const FLASH_DURATION_MS = 3000;

export function useFilterChangeStatus(filterIdx: number) {
  const dispatch = useAppDispatch();
  const key = filterIdx.toString();
  const isPidReconfigured = useAppSelector((state) =>
    selectPidReconfiguredFilters(state).includes(key),
  );
  const isArgUpdated = useAppSelector((state) =>
    selectArgUpdatedFilters(state).includes(key),
  );

  const [showPidBadge, setShowPidBadge] = useState(false);
  const [showArgBadge, setShowArgBadge] = useState(false);

  const prevPid = useRef(false);
  const prevArg = useRef(false);

  // Detect rising edge only (false → true)
  useEffect(() => {
    if (isPidReconfigured && !prevPid.current) {
      setShowPidBadge(true);
    }
    prevPid.current = isPidReconfigured;
  }, [isPidReconfigured]);

  useEffect(() => {
    if (isArgUpdated && !prevArg.current) {
      setShowArgBadge(true);
    }
    prevArg.current = isArgUpdated;
  }, [isArgUpdated]);

  // Auto-hide timers (independent of Redux state changes)
  useEffect(() => {
    if (!showPidBadge) return;
    const timer = setTimeout(() => {
      setShowPidBadge(false);
      dispatch(clearPidReconfigured(filterIdx));
    }, FLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [showPidBadge, filterIdx, dispatch]);

  useEffect(() => {
    if (!showArgBadge) return;
    const timer = setTimeout(() => {
      setShowArgBadge(false);
      dispatch(clearArgUpdated(filterIdx));
    }, FLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [showArgBadge, filterIdx, dispatch]);

  return { showPidBadge, showArgBadge };
}
