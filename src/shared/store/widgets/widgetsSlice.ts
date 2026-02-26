import {
  createSlice,
  createListenerMiddleware,
  isAnyOf,
} from '@reduxjs/toolkit';
import { initialState } from './widgetsInitialState';
import * as reducers from './widgetUtils';
import { saveLayoutsToStorage, saveLastUsedLayout } from './layoutStorage';

export type {
  RootState,
  LayoutState,
  ViewMode,
  FilterView,
  WidgetsState,
} from './types';

import type { WidgetsState } from './types';

const widgetsSlice = createSlice({
  name: 'widgets',
  initialState,
  reducers: {
    // Basic widget management
    addWidget: reducers.addWidgetReducer,
    removeWidget: reducers.removeWidgetReducer,
    maximizeWidget: reducers.maximizeWidgetReducer,
    minimizeWidget: reducers.minimizeWidgetReducer,
    restoreWidget: reducers.restoreWidgetReducer,
    updateWidgetPosition: reducers.updateWidgetPositionReducer,

    // Layout management
    saveLayout: reducers.saveLayoutReducer,
    loadLayout: reducers.loadLayoutReducer,
    deleteLayout: reducers.deleteLayoutReducer,

    //  Dual-mode actions
    openFilterInline: reducers.openFilterInlineReducer,
    detachFilter: reducers.detachFilterReducer,
    attachFilter: reducers.attachFilterReducer,
    closeFilter: reducers.closeFilterReducer,
    cleanupStaleFilters: reducers.cleanupStaleFiltersReducer,
  },
});

export const {
  addWidget,
  removeWidget,
  maximizeWidget,
  minimizeWidget,
  restoreWidget,
  updateWidgetPosition,
  saveLayout,
  loadLayout,
  deleteLayout,
  // Dual-mode actions
  openFilterInline,
  detachFilter,
  attachFilter,
  closeFilter,
  cleanupStaleFilters,
} = widgetsSlice.actions;

export default widgetsSlice.reducer;

/** Listener middleware for localStorage persistence */
export const widgetsListenerMiddleware = createListenerMiddleware();

// Save savedLayouts when they change
widgetsListenerMiddleware.startListening({
  matcher: isAnyOf(saveLayout, deleteLayout),
  effect: (_, api) => {
    const state = api.getState() as { widgets: WidgetsState };
    saveLayoutsToStorage(state.widgets.savedLayouts);
  },
});

// Save currentLayout when it changes
widgetsListenerMiddleware.startListening({
  matcher: isAnyOf(saveLayout, loadLayout),
  effect: (_, api) => {
    const state = api.getState() as { widgets: WidgetsState };
    saveLastUsedLayout(state.widgets.currentLayout);
  },
});
