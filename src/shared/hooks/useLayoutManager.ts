import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import {
  saveLayout,
  loadLayout,
  deleteLayout,
} from '../store/slices/widgetsSlice';
import { selectSavedLayouts, selectCurrentLayout } from '../store/selectors';
import {
  saveLayoutsToStorage,
  saveLastUsedLayout,
} from '../store/widgets/layoutStorage';

export const useLayoutManager = () => {
  const dispatch = useAppDispatch();
  const savedLayouts = useAppSelector(selectSavedLayouts);
  const currentLayout = useAppSelector(selectCurrentLayout);

  const save = (layoutName: string) => {
    dispatch(saveLayout(layoutName));
  };

  const load = (layoutName: string) => {
    dispatch(loadLayout(layoutName));
  };

  const remove = (layoutName: string) => {
    dispatch(deleteLayout(layoutName));
  };

  const getLayoutNames = () => Object.keys(savedLayouts);

  const getLayout = (layoutName: string) => savedLayouts[layoutName];

  useEffect(() => {
    saveLayoutsToStorage(savedLayouts);
  }, [savedLayouts]);

  useEffect(() => {
    saveLastUsedLayout(currentLayout);
  }, [currentLayout]);

  return {
    savedLayouts,
    currentLayout,
    save,
    load,
    remove,
    getLayoutNames,
    getLayout,
  };
};
