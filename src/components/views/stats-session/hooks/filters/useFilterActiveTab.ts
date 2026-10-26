import { useCallback, useEffect } from 'react';
import { useStore } from 'react-redux';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';
import type { RootState } from '@/shared/store';
import {
  isInitialTabType,
  type InitialTabType,
} from '@/shared/store/slices/graphSlice';
import { clearSelectedPidsByFilter } from '@/shared/store/slices/monitoredFilterSlice';
import { selectFilterActiveTab } from '@/shared/store/selectors/widgets/widgetsSelectors';
import { setFilterViewState } from '@/shared/store/widgets/widgetsSlice';

export const useFilterActiveTab = (
  filterIdx: number,
  initialTab?: InitialTabType,
) => {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const activeTab = useAppSelector((state) =>
    selectFilterActiveTab(state, filterIdx),
  );

  const handleTabChange = useCallback(
    (tab: string) => {
      if (!isInitialTabType(tab)) return;
      if (tab === selectFilterActiveTab(store.getState(), filterIdx)) return;
      dispatch(clearSelectedPidsByFilter(filterIdx));
      dispatch(setFilterViewState({ filterIdx, patch: { activeTab: tab } }));
    },
    [dispatch, filterIdx, store],
  );

  useEffect(() => {
    if (initialTab) handleTabChange(initialTab);
  }, [initialTab, handleTabChange]);

  return { activeTab, handleTabChange };
};
