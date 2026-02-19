import { useCallback } from 'react';
import { useAppDispatch } from '@/shared/hooks/redux';
import {
  openFilterInline,
  detachFilter,
  closeFilter,
} from '@/shared/store/slices/widgetsSlice';
import { useSidebar } from '@/shared/hooks/useSidebar';

/**
 * Hook to provide filter action handlers
 * Centralizes all filter-related actions (open, detach, close, properties)
 */
export const useFilterHandlers = (onTabChange?: (tab: string) => void) => {
  const dispatch = useAppDispatch();
  const { openFilterArgs } = useSidebar();

  const handleCardClick = useCallback(
    (filterIdx: number) => {
      dispatch(openFilterInline(filterIdx));
      onTabChange?.(`filter-${filterIdx}`);
    },
    [dispatch, onTabChange],
  );

  const handleDetachTab = useCallback(
    (filterIdx: number, filterName: string, e: React.SyntheticEvent) => {
      e.stopPropagation();
      dispatch(detachFilter({ idx: filterIdx, name: filterName }));
      onTabChange?.('main');
    },
    [dispatch, onTabChange],
  );

  const handleCloseTab = useCallback(
    (filterIdx: number, e: React.SyntheticEvent) => {
      e.stopPropagation();
      dispatch(closeFilter(filterIdx));
      onTabChange?.('main');
    },
    [dispatch, onTabChange],
  );

  return {
    handleCardClick,
    handleDetachTab,
    handleCloseTab,
    handleOpenProperties: openFilterArgs,
  };
};
