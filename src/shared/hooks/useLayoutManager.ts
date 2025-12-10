import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import {
  saveLayout,
  loadLayout,
  deleteLayout,
} from '../store/slices/widgetsSlice';
import { selectSavedLayouts } from '../store/selectors/widgets';
import { saveLayoutsToStorage } from '../store/widgets/layoutStorage';

export const useLayoutManager = () => {
  const dispatch = useAppDispatch();
  const savedLayouts = useAppSelector(selectSavedLayouts);

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

  return {
    savedLayouts,
    save,
    load,
    remove,
    getLayoutNames,
    getLayout,
  };
};
