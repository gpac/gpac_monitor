import { WidgetsState } from './types';
import { loadLayoutFromStorage, loadLastUsedLayout } from './layoutStorage';
import { DEFAULT_LAYOUT, getLayoutPreset } from './layoutPresets';

function buildFactoryDefaultState(): WidgetsState {
  const defaultLayout = getLayoutPreset(DEFAULT_LAYOUT);

  return {
    activeWidgets: defaultLayout?.widgets ?? [],
    configs: defaultLayout?.configs ?? {},
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

  const savedLayouts = loadLayoutFromStorage() ?? {};
  const lastUsedLayoutName = loadLastUsedLayout();
  const lastUsedLayout = lastUsedLayoutName
    ? (savedLayouts[lastUsedLayoutName] ?? getLayoutPreset(lastUsedLayoutName))
    : undefined;
  const layoutNameToLoad = lastUsedLayout ? lastUsedLayoutName! : 'default';
  const layoutToLoad = lastUsedLayout ?? savedLayouts.default;

  // No layout to load, but preserve all saved layouts
  if (!layoutToLoad) {
    return {
      ...base,
      savedLayouts,
    };
  }

  return {
    ...base,
    activeWidgets: layoutToLoad.widgets,
    configs: layoutToLoad.configs,
    savedLayouts,
    currentLayout: layoutNameToLoad,
  };
})();
