import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Widget, WidgetType, WidgetConfig } from '@/types/ui/widget';
import { createSelector } from '@reduxjs/toolkit';
import { generateID } from '@/utils/id';

export interface RootState {
  widgets: WidgetsState;
}

export interface LayoutState {
  name: string;
  widgets: Widget[];
  configs: Record<string, WidgetConfig>;
  createdAt: string;
}

export interface WidgetsState {
  activeWidgets: Widget[];
  configs: Record<string, WidgetConfig>;
  savedLayouts: Record<string, LayoutState>;
  selectedNode: {
    name: string;
    type: string;
    itag: string | null;
    ID: string | null;
    nb_ipid: number;
    nb_opid: number;
    status: string;
    bytes_done: number;
    idx: number;
    gpac_args: string[];
    ipid: Record<string, any>;
    opid: Record<string, any>;
  } | null;
}

export const selectActiveWidgets = (state: RootState) =>
  state.widgets.activeWidgets;
export const selectWidgetConfigs = (state: RootState) => state.widgets.configs;
export const selectSavedLayouts = (state: RootState) =>
  state.widgets.savedLayouts;

export const selectWidgetById = createSelector(
  [
    (state: RootState) => state.widgets.activeWidgets,
    (_: RootState, widgetId: string) => widgetId,
  ],
  (widgets, widgetId) => widgets.find((w) => w.id === widgetId),
);

const defaultConfig: WidgetConfig = {
  isMaximized: false,
  isMinimized: false,
  settings: {},
};

const initialState: WidgetsState = {
  activeWidgets: [
    {
      id: generateID('multi-filter'),
      type: WidgetType.MULTI_FILTER,
      title: 'Session filters overview',
      x: 0,
      y: 0,
      w: 7,
      h: 7,
    },
    {
      id: generateID('metrics'),
      type: WidgetType.METRICS,
      title: 'System metrics',
      x: 9,
      y: 8,
      w: 5,
      h: 7,
    },
    {
      id: generateID('graph'),
      type: WidgetType.GRAPH,
      title: 'Pipeline Graph',
      x: 0,
      y: 8,
      w: 7,
      h: 6,
    },
    {
      id: generateID('logs'),
      type: WidgetType.LOGS,
      title: 'System Logs',
      x: 9,
      y: 8,
      w: 5,
      h: 6,
    },
  ],
  configs: {
    'metrics-1': { ...defaultConfig },
    'multi-filter-1': { ...defaultConfig },
    'graph-1': { ...defaultConfig },
  },
  savedLayouts: {},
  selectedNode: null,
};

const widgetsSlice = createSlice({
  name: 'widgets',
  initialState,
  reducers: {
    addWidget: (state, action: PayloadAction<Widget>) => {
      state.activeWidgets.push(action.payload);
      state.configs[action.payload.id] = { ...defaultConfig };
    },
    removeWidget: (state, action: PayloadAction<string>) => {
      console.log('removeWidget action triggered with id:', action.payload);
      const widgetId = action.payload;

      state.activeWidgets = state.activeWidgets.filter(
        (w) => w.id !== widgetId,
      );

      if (state.configs[widgetId]) {
        const { [widgetId]: _, ...remainingConfigs } = state.configs;
        state.configs = remainingConfigs;
      }

      console.log('State after removal:', {
        activeWidgets: state.activeWidgets,
        configs: state.configs,
      });
    },
    maximizeWidget: (state, action: PayloadAction<string>) => {
      if (state.configs[action.payload]) {
        state.configs[action.payload] = {
          ...state.configs[action.payload],
          isMaximized: true,
          isMinimized: false,
        };
      }
    },
    minimizeWidget: (state, action: PayloadAction<string>) => {
      if (state.configs[action.payload]) {
        state.configs[action.payload] = {
          ...state.configs[action.payload],
          isMaximized: false,
          isMinimized: true,
        };
      }
    },
    restoreWidget: (state, action: PayloadAction<string>) => {
      if (state.configs[action.payload]) {
        state.configs[action.payload] = {
          ...state.configs[action.payload],
          isMaximized: false,
          isMinimized: false,
        };
      }
    },
    updateWidgetPosition: (
      state,
      action: PayloadAction<{
        id: string;
        x: number;
        y: number;
        w: number;
        h: number;
      }>,
    ) => {
      const widget = state.activeWidgets.find(
        (w) => w.id === action.payload.id,
      );
      if (widget) {
        widget.x = action.payload.x;
        widget.y = action.payload.y;
        widget.w = action.payload.w;
        widget.h = action.payload.h;
      }
    },
    setSelectedNode: (
      state,
      action: PayloadAction<WidgetsState['selectedNode']>,
    ) => {
      state.selectedNode = action.payload;
    },
    saveLayout: (state, action: PayloadAction<string>) => {
      const layoutName = action.payload;
      state.savedLayouts[layoutName] = {
        name: layoutName,
        widgets: [...state.activeWidgets],
        configs: { ...state.configs },
        createdAt: new Date().toISOString(),
      };
    },
    loadLayout: (state, action: PayloadAction<string>) => {
      const layoutName = action.payload;
      const layout = state.savedLayouts[layoutName];
      if (layout) {
        state.activeWidgets = [...layout.widgets];
        state.configs = { ...layout.configs };
      }
    },
    deleteLayout: (state, action: PayloadAction<string>) => {
      const layoutName = action.payload;
      delete state.savedLayouts[layoutName];
    },
  },
});

export const {
  addWidget,
  removeWidget,
  maximizeWidget,
  minimizeWidget,
  restoreWidget,
  updateWidgetPosition,
  setSelectedNode,
  saveLayout,
  loadLayout,
  deleteLayout,
} = widgetsSlice.actions;

// Memoized selectors
const selectWidgetConfigsInternal = (state: { widgets: WidgetsState }) => state.widgets.configs;
const defaultWidgetConfig: WidgetConfig = {
  isMaximized: false,
  isMinimized: false,
  settings: {},
};

/** Memoized selector for widget config by ID */
export const makeSelectWidgetConfig = () =>
  createSelector(
    [selectWidgetConfigsInternal, (_: any, id: string) => id],
    (configs, id) => configs[id] ?? defaultWidgetConfig
  );

export default widgetsSlice.reducer;
