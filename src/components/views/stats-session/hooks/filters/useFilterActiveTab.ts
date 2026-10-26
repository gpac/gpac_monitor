import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';
import {
  isInitialTabType,
  type InitialTabType,
} from '@/shared/store/slices/graphSlice';
import { selectFilterActiveTab } from '@/shared/store/selectors/widgets/widgetsSelectors';
import { setFilterViewState } from '@/shared/store/widgets/widgetsSlice';

export const useFilterActiveTab = (
  filterIdx: number,
  initialTab?: InitialTabType,
) => {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector((state) =>
    selectFilterActiveTab(state, filterIdx),
  );

  const handleTabChange = useCallback(
    (tab: string) => {
      if (!isInitialTabType(tab)) return;
      dispatch(setFilterViewState({ filterIdx, patch: { activeTab: tab } }));
    },
    [dispatch, filterIdx],
  );

  useEffect(() => {
    if (initialTab) handleTabChange(initialTab);
  }, [initialTab, handleTabChange]);

  return { activeTab, handleTabChange };
};
