import { createWidgetInstance } from '@/components/Widget/registry';
import { WidgetConfig, Widget } from '@/types';

const defaultConfig: WidgetConfig = {
  isMaximized: false,
  isMinimized: false,
  settings: {},
};
import { widgetRegistry } from '@/components/Widget/registry';
import { WidgetsState } from './widgetsSlice';

const activeWidgets = Object.values(widgetRegistry)
  .filter((def) => def.enabled)
  .map((def) => createWidgetInstance(def.type))
  .filter(Boolean) as Widget[];

const configs = Object.fromEntries(
  activeWidgets.map((w) => [w.id, { ...defaultConfig }]),
);

export const initialState: WidgetsState = {
  activeWidgets: activeWidgets,
  configs,
  savedLayouts: {},
  viewByFilter: {},
};
