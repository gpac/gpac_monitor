import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/shared/hooks/redux';
import {
  clearPidReconfigured,
  clearArgUpdated,
} from '@/shared/store/slices/graphSlice';

const FLASH_DURATION_MS = 3000;
const NO_BADGE = { showPidBadge: false, showArgBadge: false } as const;

export function useFilterChangeStatusLive(filterIdx: number, enabled: boolean) {
  const dispatch = useAppDispatch();
  const key = filterIdx.toString();

  const isPidReconfigured = useAppSelector(
    (state) => (state.graph.pidReconfiguredCounts[key] ?? 0) > 0,
  );
  const isArgUpdated = useAppSelector(
    (state) => (state.graph.argUpdatedCounts[key] ?? 0) > 0,
  );

  const [showPidBadge, setShowPidBadge] = useState(false);
  const [showArgBadge, setShowArgBadge] = useState(false);

  useEffect(() => {
    if (!enabled || !isPidReconfigured) {
      setShowPidBadge(false);
      return;
    }
    setShowPidBadge(true);
    const timer = setTimeout(() => {
      setShowPidBadge(false);
      dispatch(clearPidReconfigured(filterIdx));
    }, FLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [enabled, isPidReconfigured, filterIdx, dispatch]);

  useEffect(() => {
    if (!enabled || !isArgUpdated) {
      setShowArgBadge(false);
      return;
    }
    setShowArgBadge(true);
    const timer = setTimeout(() => {
      setShowArgBadge(false);
      dispatch(clearArgUpdated(filterIdx));
    }, FLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [enabled, isArgUpdated, filterIdx, dispatch]);

  if (!enabled) return NO_BADGE;
  return { showPidBadge, showArgBadge };
}
