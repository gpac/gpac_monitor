import { useCallback } from 'react';
import { useStore } from 'react-redux';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';
import type { RootState } from '@/shared/store';
import { selectFilterOpenPreviews } from '@/shared/store/selectors/widgets/widgetsSelectors';
import type { OpenPreviews } from '@/shared/store/widgets/types';
import { setFilterViewState } from '@/shared/store/widgets/widgetsSlice';

type PreviewDirection = keyof OpenPreviews;

const togglePidIdx = (openPidIdxs: number[], pidIdx: number) =>
  openPidIdxs.includes(pidIdx)
    ? openPidIdxs.filter((openPidIdx) => openPidIdx !== pidIdx)
    : [...openPidIdxs, pidIdx];

export const useOpenPreviews = (filterIdx: number) => {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const openPreviews = useAppSelector((state) =>
    selectFilterOpenPreviews(state, filterIdx),
  );

  const togglePreview = useCallback(
    (direction: PreviewDirection, pidIdx: number) => {
      const current = selectFilterOpenPreviews(store.getState(), filterIdx);
      dispatch(
        setFilterViewState({
          filterIdx,
          patch: {
            openPreviews: {
              ...current,
              [direction]: togglePidIdx(current[direction], pidIdx),
            },
          },
        }),
      );
    },
    [dispatch, filterIdx, store],
  );

  const toggleInputPreview = useCallback(
    (pidIdx: number) => togglePreview('input', pidIdx),
    [togglePreview],
  );

  const toggleOutputPreview = useCallback(
    (pidIdx: number) => togglePreview('output', pidIdx),
    [togglePreview],
  );

  return { openPreviews, toggleInputPreview, toggleOutputPreview };
};
