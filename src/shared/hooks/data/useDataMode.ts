import { useMemo } from 'react';
import { useDataSource } from '@/services/dataSource/DataSourceContext';

/**
 * Centralized hook for data mode guards.
 * Single ownership: all live/history branching reads from here.
 */
export const useDataMode = () => {
  const { mode } = useDataSource();

  return useMemo(
    () => ({
      mode,
      isLive: mode === 'live',
      isHistory: mode === 'history',
    }),
    [mode],
  );
};
