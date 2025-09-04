import { useAppDispatch, useAppSelector } from './redux';
import {
  saveLayout,
  loadLayout,
  deleteLayout,
  selectSavedLayouts,
} from '../store/slices/widgetsSlice';

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

  return {
    savedLayouts,
    save,
    load,
    remove,
    getLayoutNames,
    getLayout,
  };
};
