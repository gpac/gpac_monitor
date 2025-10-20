import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Widget, WidgetType, WidgetConfig } from '@/types/ui/widget';
import { createSelector } from '@reduxjs/toolkit';
import {
  createWidgetInstance,
  widgetRegistry,
} from '@/components/Widget/registry';

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
    idx: number;
    name: string;
    gpac_args: any[];
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
const activeWidgets = Object.values(widgetRegistry)
  .filter((def) => def.enabled)
  .map((def) => createWidgetInstance(def.type))
  .filter(Boolean) as Widget[];

const configs = Object.fromEntries(
  activeWidgets.map((w) => [w.id, { ...defaultConfig }]),
);

const initialState: WidgetsState = {
  activeWidgets: activeWidgets,

  configs,
  savedLayouts: {},
  selectedNode: null,
};

const widgetsSlice = createSlice({
  name: 'widgets',
  initialState,
  reducers: {
    addWidget: (state, action: PayloadAction<WidgetType>) => {
      const instance = createWidgetInstance(action.payload);
      if (!instance) return;
      const exists = state.activeWidgets.some((w) => w.type === instance.type);
      if (exists) return;
      state.activeWidgets.push(instance);
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
const selectWidgetConfigsInternal = (state: { widgets: WidgetsState }) =>
  state.widgets.configs;
const defaultWidgetConfig: WidgetConfig = {
  isMaximized: false,
  isMinimized: false,
  settings: {},
};

/** Memoized selector for widget config by ID */
export const makeSelectWidgetConfig = () =>
  createSelector(
    [selectWidgetConfigsInternal, (_: any, id: string) => id],
    (configs, id) => configs[id] ?? defaultWidgetConfig,
  );

export default widgetsSlice.reducer;
