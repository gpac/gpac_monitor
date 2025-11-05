import { createSlice } from '@reduxjs/toolkit';
import { Widget, WidgetConfig } from '@/types/ui/widget';
import { initialState } from './widgetsInitialState';
import * as reducers from './widgetUtils';

export interface RootState {
  widgets: WidgetsState;
}

export interface LayoutState {
  name: string;
  widgets: Widget[];
  configs: Record<string, WidgetConfig>;
  createdAt: string;
}

export type ViewMode = 'inline' | 'detached';

export interface FilterView {
  mode: ViewMode;
  widgetId?: string;
}

export interface WidgetsState {
  activeWidgets: Widget[];
  configs: Record<string, WidgetConfig>;
  savedLayouts: Record<string, LayoutState>;
  viewByFilter: Record<number, FilterView | undefined>;
}

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
} = widgetsSlice.actions;

export default widgetsSlice.reducer;
