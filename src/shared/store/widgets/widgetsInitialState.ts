import { createWidgetInstance } from '@/components/Widget/registry';
import { widgetRegistry } from '@/components/Widget/registry';
import { WidgetConfig, Widget } from '@/types';
import { WidgetsState } from './widgetsSlice';
import { loadLayoutFromStorage } from './layoutStorage';

const defaultConfig: WidgetConfig = {
  isMaximized: false,
  isMinimized: false,
  settings: {},
};

function buildFactoryDefaultState(): WidgetsState {
  const activeWidgets = Object.values(widgetRegistry)
    .filter((def) => def.enabled)
    .map((def) => createWidgetInstance(def.type))
    .filter(Boolean) as Widget[];

  const configs = Object.fromEntries(
    activeWidgets.map((w) => [w.id, { ...defaultConfig }]),
  );

  return {
    activeWidgets,
    configs,
    savedLayouts: {},
    viewByFilter: {},
    currentLayout: undefined,
  };
}

export const initialState: WidgetsState = (() => {
  const base = buildFactoryDefaultState();

  if (typeof window === 'undefined') {
    return base;
  }

  const savedLayouts = loadLayoutFromStorage();

  // No saved layouts at all
  if (!savedLayouts || Object.keys(savedLayouts).length === 0) {
    return base;
  }

  const defaultLayout = savedLayouts['default'];

  // No default layout, but preserve all saved layouts
  if (!defaultLayout) {
    return {
      ...base,
      savedLayouts,
    };
  }

  return {
    ...base,
    activeWidgets: defaultLayout.widgets,
    configs: defaultLayout.configs,
    savedLayouts,
    currentLayout: 'default',
  };
})();
