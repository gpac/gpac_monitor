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

  // Restore position from current layout if fixedPosition
  if (instance.fixedPosition && state.currentLayout) {
    const layout = state.savedLayouts[state.currentLayout];
    const saved = layout?.widgets.find((w) => w.type === instance.type);
    if (saved) {
      instance.x = saved.x;
      instance.y = saved.y;
    }
  }

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
  if (widget && !widget.fixedPosition) {
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
  state.currentLayout = layoutName;
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
    state.currentLayout = layoutName;
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

  // Get all grid widgets (non-detached)
  const gridWidgets = state.activeWidgets.filter((w) => !w.isDetached);

  // Calculate max Y from existing grid widgets
  const maxY = gridWidgets.reduce((max, w) => Math.max(max, w.y + w.h), 0);

  // Count existing detached widgets
  const detachedCount = Object.values(state.viewByFilter).filter(
    (v) => v?.mode === 'detached',
  ).length;

  // Position in grid at bottom, with smart layout
  const cols = 24;
  const widgetWidth = 6;
  const widgetHeight = 6;
  const maxWidgetsPerRow = Math.floor(cols / widgetWidth);

  const row = Math.floor(detachedCount / maxWidgetsPerRow);
  const col = detachedCount % maxWidgetsPerRow;

  widget.x = col * widgetWidth;
  widget.y = maxY + row * (widgetHeight + 1);
  widget.w = widgetWidth;
  widget.h = widgetHeight;

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
