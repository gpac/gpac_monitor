import { createContext, useContext } from 'react';

const FilterViewContext = createContext(false);

export const useIsDetached = () => useContext(FilterViewContext);
export const FilterViewProvider = FilterViewContext.Provider;
