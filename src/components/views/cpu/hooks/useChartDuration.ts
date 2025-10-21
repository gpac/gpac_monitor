import { useState, useEffect, useMemo } from 'react';
import {
  ChartDuration,
  getDurationInMs,
  getMaxPointsFromDuration,
} from '@/utils/chartDuration';

/**
 * Hook for managing chart duration, window duration, and max points
 *
 * @param storageKey - LocalStorage key for persisting duration preference
 * @param defaultDuration - Default duration value
 * @param updateInterval - Chart update interval in milliseconds (e.g., 150ms for CPU, 1000ms for Stats)
 * @returns Duration state and derived values
 */
export const useChartDuration = (
  storageKey: string,
  defaultDuration: ChartDuration,
  updateInterval: number,
) => {
  // Restore from localStorage or use default
  const [duration, setDuration] = useState<ChartDuration>(() => {
    const stored = localStorage.getItem(storageKey);
    return (stored as ChartDuration) || defaultDuration;
  });

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(storageKey, duration);
  }, [duration, storageKey]);

  // Calculate derived values
  const windowDuration = useMemo(() => getDurationInMs(duration), [duration]);

  const maxPoints = useMemo(
    () => getMaxPointsFromDuration(duration, updateInterval),
    [duration, updateInterval],
  );

  return {
    duration,
    setDuration,
    windowDuration,
    maxPoints,
  };
};
