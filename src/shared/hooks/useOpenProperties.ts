import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import { setSelectedFilterForArgs } from '@/shared/store/slices/filterArgumentSlice';
import { setSelectedEdge } from '@/shared/store/slices/graphSlice';
import { openSidebar } from '@/shared/store/slices/layoutSlice';
import type { SelectedEdgeInfo } from '@/types/domain/gpac/pid_props';

interface FilterInfo {
  idx: number;
  name: string;
}

/**
 * Hook to open PropertiesView - KISS approach
 * Returns two functions for different use cases:
 * - openFilterProperties: filter arguments
 * - openPIDProperties: input PID properties (like edge click)
 */
export const useOpenProperties = () => {
  const dispatch = useAppDispatch();
  const selectedEdge = useAppSelector((state) => state.graph.selectedEdge);
  const selectedFilterForArgs = useAppSelector(
    (state) => state.filterArgument.selectedFilterForArgs,
  );
  const isSidebarOpen = useAppSelector((state) => state.layout.isSidebarOpen);

  const openFilterProperties = useCallback(
    (filter: FilterInfo) => {
      if (selectedEdge !== null) {
        dispatch(setSelectedEdge(null));
      }
      dispatch(setSelectedFilterForArgs({ idx: filter.idx, name: filter.name }));
      if (!isSidebarOpen) {
        dispatch(openSidebar());
      }
    },
    [dispatch, selectedEdge, isSidebarOpen],
  );

  const openPIDProperties = useCallback(
    (edgeInfo: SelectedEdgeInfo) => {
      if (selectedFilterForArgs !== null) {
        dispatch(setSelectedFilterForArgs(null));
      }
      dispatch(setSelectedEdge(edgeInfo));
      if (!isSidebarOpen) {
        dispatch(openSidebar());
      }
    },
    [dispatch, selectedFilterForArgs, isSidebarOpen],
  );

  return { openFilterProperties, openPIDProperties };
};
