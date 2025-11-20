import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import {
  setSidebarContent,
  closeSidebar as closeSidebarAction,
  SidebarContentType,
} from '@/shared/store/slices/layoutSlice';

interface FilterInfo {
  idx: number;
  name: string;
}

interface PIDInfo {
  filterIdx: number;
  ipidIdx: number;
}

/**
 * Hook to manage sidebar state - KISS approach
 * Single entry point for opening/closing sidebar with different content
 */
export const useSidebar = () => {
  const dispatch = useAppDispatch();
  const sidebarContent = useAppSelector((state) => state.layout.sidebarContent);
  const isOpen = sidebarContent !== null;

  const openFilterArgs = useCallback(
    (filter: FilterInfo) => {
      dispatch(
        setSidebarContent({
          type: 'filter-args',
          filterIdx: filter.idx,
          filterName: filter.name,
        }),
      );
    },
    [dispatch],
  );

  const openPIDProps = useCallback(
    (pid: PIDInfo) => {
      dispatch(
        setSidebarContent({
          type: 'pid-props',
          filterIdx: pid.filterIdx,
          ipidIdx: pid.ipidIdx,
        }),
      );
    },
    [dispatch],
  );

  const closeSidebar = useCallback(() => {
    dispatch(closeSidebarAction());
  }, [dispatch]);

  return {
    isOpen,
    sidebarContent,
    openFilterArgs,
    openPIDProps,
    closeSidebar,
  };
};

// Re-export types for convenience
export type { SidebarContentType };
