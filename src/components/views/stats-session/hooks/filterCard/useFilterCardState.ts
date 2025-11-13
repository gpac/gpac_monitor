import { useCallback, useMemo } from 'react';

interface UseFilterCardStateParams {
  filterIdx: number | undefined;
  isMonitored: boolean;
  isDetached: boolean;
  onClick?: (idx: number) => void;
}

/**
 * Hook to manage FilterStatCard state and interactions
 * Expansion state is now managed at parent level
 */
export const useFilterCardState = ({
  filterIdx,
  isMonitored,
  isDetached,
  onClick,
}: UseFilterCardStateParams) => {
  const handleClick = useCallback(() => {
    if (onClick && filterIdx !== undefined) {
      onClick(filterIdx);
    }
  }, [filterIdx, onClick]);

  const isMonitoredOrDetached = useMemo(
    () => isMonitored || isDetached,
    [isMonitored, isDetached],
  );

  const ringClass = useMemo(() => {
    return isMonitoredOrDetached
      ? 'ring-2 ring-red-700/90'
      : 'ring-1 ring-transparent hover:ring-monitor-accent/40';
  }, [isMonitoredOrDetached]);

  const cursorClass = useMemo(
    () =>
      isDetached
        ? 'cursor-not-allowed opacity-60'
        : 'cursor-pointer hover:bg-white/4',
    [isDetached],
  );

  return {
    handleClick,
    ringClass,
    cursorClass,
  };
};
