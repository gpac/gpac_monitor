import { PayloadAction } from '@reduxjs/toolkit';
import { Widget, WidgetType } from '@/types/ui/widget';
import { createWidgetInstance } from '@/components/Widget/registry';
import { WidgetsState } from './widgetsSlice';

// Basic widget management
export const addWidgetReducer = (
  state: WidgetsState,
  action: PayloadAction<WidgetType>,
) => {
  const instance = createWidgetInstance(action.payload);
  if (!instance) return;
  const exists = state.activeWidgets.some((w) => w.type === instance.type);
  if (exists) return;
  state.activeWidgets.push(instance as Widget);
};

export const removeWidgetReducer = (
  state: WidgetsState,
  action: PayloadAction<string>,
) => {
  const widgetId = action.payload;
  state.activeWidgets = state.activeWidgets.filter((w) => w.id !== widgetId);
  if (state.configs[widgetId]) {
    const { [widgetId]: _, ...remainingConfigs } = state.configs;
    state.configs = remainingConfigs;
  }
};

export const maximizeWidgetReducer = (
  state: WidgetsState,
  action: PayloadAction<string>,
) => {
  if (state.configs[action.payload]) {
    state.configs[action.payload] = {
      ...state.configs[action.payload],
      isMaximized: true,
      isMinimized: false,
    };
  }
};

export const minimizeWidgetReducer = (
  state: WidgetsState,
  action: PayloadAction<string>,
) => {
  if (state.configs[action.payload]) {
    state.configs[action.payload] = {
      ...state.configs[action.payload],
      isMaximized: false,
      isMinimized: true,
    };
  }
};

export const restoreWidgetReducer = (
  state: WidgetsState,
  action: PayloadAction<string>,
) => {
  if (state.configs[action.payload]) {
    state.configs[action.payload] = {
      ...state.configs[action.payload],
      isMaximized: false,
      isMinimized: false,
    };
  }
};

export const updateWidgetPositionReducer = (
  state: WidgetsState,
  action: PayloadAction<{
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }>,
) => {
  const widget = state.activeWidgets.find((w) => w.id === action.payload.id);
  if (widget) {
    widget.x = action.payload.x;
    widget.y = action.payload.y;
    widget.w = action.payload.w;
    widget.h = action.payload.h;
  }
};

// Layout management
export const saveLayoutReducer = (
  state: WidgetsState,
  action: PayloadAction<string>,
) => {
  const layoutName = action.payload;
  state.savedLayouts[layoutName] = {
    name: layoutName,
    widgets: [...state.activeWidgets],
    configs: { ...state.configs },
    createdAt: new Date().toISOString(),
  };
};

export const loadLayoutReducer = (
  state: WidgetsState,
  action: PayloadAction<string>,
) => {
  const layoutName = action.payload;
  const layout = state.savedLayouts[layoutName];
  if (layout) {
    state.activeWidgets = [...layout.widgets];
    state.configs = { ...layout.configs };
  }
};

export const deleteLayoutReducer = (
  state: WidgetsState,
  action: PayloadAction<string>,
) => {
  const layoutName = action.payload;
  delete state.savedLayouts[layoutName];
};

// Dual-mode filter view reducers
export const openFilterInlineReducer = (
  state: WidgetsState,
  action: PayloadAction<number>,
) => {
  const filterIdx = action.payload;
  const current = state.viewByFilter[filterIdx];

  if (current?.mode === 'detached' && current.widgetId) {
    state.activeWidgets = state.activeWidgets.filter(
      (w) => w.id !== current.widgetId,
    );
    delete state.configs[current.widgetId];
  }

  state.viewByFilter[filterIdx] = { mode: 'inline' };
};

export const detachFilterReducer = (
  state: WidgetsState,
  action: PayloadAction<{ idx: number; name: string }>,
) => {
  const { idx, name } = action.payload;
  const widget = createWidgetInstance(WidgetType.FILTERSESSION);
  if (!widget) return;

  widget.isDetached = true;
  widget.detachedFilterIdx = idx;
  widget.title = name;
  widget.isFloating = true;
  widget.floatingX = 300 + state.activeWidgets.length * 30;
  widget.floatingY = 100 + state.activeWidgets.length * 30;
  widget.floatingWidth = 70;
  widget.floatingHeight = 90;
  widget.zIndex = 1000 + state.activeWidgets.length;

  const detachedCount = Object.values(state.viewByFilter).filter(
    (v) => v?.mode === 'detached',
  ).length;
  widget.x = 8 + (detachedCount % 2) * 2;
  widget.y = 6 + Math.floor(detachedCount / 2) * 6;
  widget.w = 2;
  widget.h = 6;

  state.activeWidgets.push(widget as Widget);
  state.configs[widget.id] = {
    isMaximized: false,
    isMinimized: false,
    settings: {},
  };

  state.viewByFilter[idx] = { mode: 'detached', widgetId: widget.id };
};

export const attachFilterReducer = (
  state: WidgetsState,
  action: PayloadAction<number>,
) => {
  const filterIdx = action.payload;
  const view = state.viewByFilter[filterIdx];

  if (view?.mode === 'detached' && view.widgetId) {
    state.activeWidgets = state.activeWidgets.filter(
      (w) => w.id !== view.widgetId,
    );
    delete state.configs[view.widgetId];
    state.viewByFilter[filterIdx] = { mode: 'inline' };
  }
};

export const closeFilterReducer = (
  state: WidgetsState,
  action: PayloadAction<number>,
) => {
  const filterIdx = action.payload;
  const view = state.viewByFilter[filterIdx];
  if (!view) return;

  if (view.mode === 'detached' && view.widgetId) {
    state.activeWidgets = state.activeWidgets.filter(
      (w) => w.id !== view.widgetId,
    );
    delete state.configs[view.widgetId];
  }

  delete state.viewByFilter[filterIdx];
};

// Floating mode reducers
export const setWidgetFloatingReducer = (
  state: WidgetsState,
  action: PayloadAction<{
    id: string;
    isFloating: boolean;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }>,
) => {
  const widget = state.activeWidgets.find((w) => w.id === action.payload.id);
  if (widget) {
    widget.isFloating = action.payload.isFloating;
    if (action.payload.isFloating) {
      widget.floatingX = action.payload.x ?? 100;
      widget.floatingY = action.payload.y ?? 100;
      widget.floatingWidth = action.payload.width ?? 800;
      widget.floatingHeight = action.payload.height ?? 600;
    }
  }
};

export const updateFloatingPositionReducer = (
  state: WidgetsState,
  action: PayloadAction<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>,
) => {
  const widget = state.activeWidgets.find((w) => w.id === action.payload.id);
  if (widget && widget.isFloating) {
    widget.floatingX = action.payload.x;
    widget.floatingY = action.payload.y;
    widget.floatingWidth = action.payload.width;
    widget.floatingHeight = action.payload.height;
  }
};

export const setWidgetZIndexReducer = (
  state: WidgetsState,
  action: PayloadAction<{ id: string; zIndex: number }>,
) => {
  const widget = state.activeWidgets.find((w) => w.id === action.payload.id);
  if (widget) {
    widget.zIndex = action.payload.zIndex;
  }
};

export const setSelectedNodeReducer = (
  state: WidgetsState,
  action: PayloadAction<WidgetsState['selectedNode']>,
) => {
  state.selectedNode = action.payload;
};
