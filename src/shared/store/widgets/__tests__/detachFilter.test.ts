import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createWidgetInstance } from '@/components/widget/registry';
import { WidgetType, type Widget } from '@/types/ui/widget';
import widgetsReducer, {
  openFilterInline,
  detachFilter,
  attachFilter,
  replaceDetachedFilter,
  closeFilter,
  setFilterViewState,
} from '../widgetsSlice';
import {
  detachFilterReducer,
  removeWidgetReducer,
  updateWidgetPositionReducer,
} from '../widgetUtils';
import { getLayoutPreset } from '../layoutPresets';
import { WidgetsState } from '../types';
import {
  selectFilterActiveTab,
  selectFilterOpenPreviews,
  selectFilterPidMetricMode,
} from '@/shared/store/selectors/widgets/widgetsSelectors';

const detachedWidget: Widget = {
  id: 'widget-detached',
  type: WidgetType.FILTERSESSION,
  title: 'Session Filters',
  x: 0,
  y: 0,
  w: 8,
  h: 6,
};

const openOnInputsTab = () => {
  let state = widgetsReducer(undefined, { type: 'test/init' });
  state = widgetsReducer(state, openFilterInline(3));
  return widgetsReducer(
    state,
    setFilterViewState({ filterIdx: 3, patch: { activeTab: 'inputs' } }),
  );
};

describe('filter view active tab', () => {
  beforeEach(() => {
    vi.mocked(createWidgetInstance).mockReturnValue({ ...detachedWidget });
  });

  it('keeps the active tab when the filter is detached', () => {
    const state = widgetsReducer(
      openOnInputsTab(),
      detachFilter({ idx: 3, name: 'mp4mx' }),
    );

    expect(state.viewByFilter[3]?.mode).toBe('detached');
    expect(state.viewByFilter[3]?.activeTab).toBe('inputs');
  });

  it('keeps the active tab and drops the widget id when reattached', () => {
    let state = widgetsReducer(
      openOnInputsTab(),
      detachFilter({ idx: 3, name: 'mp4mx' }),
    );
    expect(state.viewByFilter[3]?.widgetId).toBe('widget-detached');
    state = widgetsReducer(state, attachFilter(3));

    expect(state.viewByFilter[3]).toEqual({
      mode: 'inline',
      activeTab: 'inputs',
    });
  });

  it('resets the active tab once the filter is closed and reopened', () => {
    let state = widgetsReducer(openOnInputsTab(), closeFilter(3));
    state = widgetsReducer(state, openFilterInline(3));

    expect(selectFilterActiveTab({ widgets: state }, 3)).toBe('overview');
    expect(selectFilterPidMetricMode({ widgets: state }, 3)).toBe('bitrate');
  });

  it('keeps the PID metric mode when the filter is detached', () => {
    let state = widgetsReducer(
      openOnInputsTab(),
      setFilterViewState({
        filterIdx: 3,
        patch: { pidMetricMode: 'processTime' },
      }),
    );
    state = widgetsReducer(state, detachFilter({ idx: 3, name: 'mp4mx' }));

    expect(selectFilterPidMetricMode({ widgets: state }, 3)).toBe(
      'processTime',
    );
  });

  it('keeps open previews when the filter is detached then reattached', () => {
    const openPreviews = { input: [0], output: [1] };
    let state = widgetsReducer(
      openOnInputsTab(),
      setFilterViewState({ filterIdx: 3, patch: { openPreviews } }),
    );
    state = widgetsReducer(state, detachFilter({ idx: 3, name: 'mp4mx' }));
    expect(selectFilterOpenPreviews({ widgets: state }, 3)).toEqual(
      openPreviews,
    );

    state = widgetsReducer(state, attachFilter(3));
    expect(selectFilterOpenPreviews({ widgets: state }, 3)).toEqual(
      openPreviews,
    );
  });

  it('drops open previews once the filter is closed', () => {
    let state = widgetsReducer(
      openOnInputsTab(),
      setFilterViewState({
        filterIdx: 3,
        patch: { openPreviews: { input: [0], output: [] } },
      }),
    );
    state = widgetsReducer(state, closeFilter(3));
    state = widgetsReducer(state, openFilterInline(3));

    const openPreviews = selectFilterOpenPreviews({ widgets: state }, 3);
    expect(openPreviews).toEqual({ input: [], output: [] });
    expect(selectFilterOpenPreviews({ widgets: state }, 4)).toBe(openPreviews);
  });

  it('ignores a patch for a filter that is not monitored', () => {
    const state = widgetsReducer(
      widgetsReducer(undefined, { type: 'test/init' }),
      setFilterViewState({ filterIdx: 7, patch: { activeTab: 'outputs' } }),
    );

    expect(state.viewByFilter[7]).toBeUndefined();
  });
});

const createEmptyState = (): WidgetsState => ({
  activeWidgets: [],
  configs: {},
  savedLayouts: {},
  viewByFilter: {},
});

const detach = (state: WidgetsState, idx: number) =>
  detachFilterReducer(state, {
    type: 'widgets/detachFilter',
    payload: { idx, name: `filter-${idx}` },
  });

const findDetachedWidget = (state: WidgetsState, idx: number) =>
  state.activeWidgets.find((widget) => widget.detachedFilterIdx === idx);

const createPresetState = (presetName: string): WidgetsState => ({
  ...createEmptyState(),
  activeWidgets: getLayoutPreset(presetName)!.widgets,
});

const closeWidgetOfType = (state: WidgetsState, type: WidgetType) =>
  removeWidgetReducer(state, {
    type: 'widgets/removeWidget',
    payload: state.activeWidgets.find((widget) => widget.type === type)!.id,
  });

describe('detachFilterReducer', () => {
  let createdCount = 0;

  beforeEach(() => {
    createdCount = 0;
    vi.mocked(createWidgetInstance).mockImplementation((type: WidgetType) => ({
      id: `widget-${createdCount++}`,
      type,
      title: '',
      x: 0,
      y: 0,
      w: 11,
      h: 8,
    }));
  });

  it('does not treat a widget dropped lower as a freed slot', () => {
    const state = createEmptyState();
    detach(state, 0);
    detach(state, 1);
    detach(state, 2);

    const firstWidget = findDetachedWidget(state, 0);
    updateWidgetPositionReducer(state, {
      type: 'widgets/updateWidgetPosition',
      payload: { id: firstWidget!.id, x: 0, y: 20, w: 8, h: 6 },
    });
    detach(state, 3);

    expect(firstWidget).toMatchObject({ x: 0, y: 0 });
    expect(findDetachedWidget(state, 3)).toMatchObject({ x: 0, y: 6 });
  });

  it('places widgets side by side when no slot was freed', () => {
    const state = createEmptyState();
    detach(state, 0);
    detach(state, 1);

    expect(findDetachedWidget(state, 1)).toMatchObject({ x: 8, y: 0 });
  });

  it('takes the place of Logs once it is closed on Default', () => {
    const state = createPresetState('Default');
    closeWidgetOfType(state, WidgetType.LOGS);

    detach(state, 0);

    expect(findDetachedWidget(state, 0)).toMatchObject({
      x: 16,
      y: 6,
      w: 8,
      h: 6,
    });
  });

  it('goes under Graph when the place of Logs is taken', () => {
    const state = createPresetState('Default');
    closeWidgetOfType(state, WidgetType.LOGS);

    detach(state, 0);
    detach(state, 1);

    expect(findDetachedWidget(state, 1)).toMatchObject({ x: 0, y: 12 });
  });

  it('fills the rows under a complete Default layout', () => {
    const state = createPresetState('Default');

    [0, 1, 2, 3].forEach((idx) => detach(state, idx));

    expect(findDetachedWidget(state, 0)).toMatchObject({ x: 0, y: 12 });
    expect(findDetachedWidget(state, 1)).toMatchObject({ x: 8, y: 12 });
    expect(findDetachedWidget(state, 2)).toMatchObject({ x: 16, y: 12 });
    expect(findDetachedWidget(state, 3)).toMatchObject({ x: 0, y: 18 });
  });

  it('fills the hole left by Graph on Default', () => {
    const state = createPresetState('Default');
    closeWidgetOfType(state, WidgetType.GRAPH);

    [0, 1, 2].forEach((idx) => detach(state, idx));

    expect(findDetachedWidget(state, 0)).toMatchObject({ x: 8, y: 6 });
    expect(findDetachedWidget(state, 1)).toMatchObject({ x: 16, y: 6 });
    expect(findDetachedWidget(state, 2)).toMatchObject({ x: 0, y: 12 });
  });

  it('skips a hole too narrow for it when Metrics is closed on Default', () => {
    const state = createPresetState('Default');
    closeWidgetOfType(state, WidgetType.METRICS);

    detach(state, 0);

    expect(findDetachedWidget(state, 0)).toMatchObject({ x: 0, y: 12 });
  });

  it('takes the hole right of Session Filters on Dashboard', () => {
    const state = createPresetState('Dashboard');
    closeWidgetOfType(state, WidgetType.GRAPH);

    detach(state, 0);

    expect(findDetachedWidget(state, 0)).toMatchObject({ x: 10, y: 0 });
  });
});

describe('replaceDetachedFilter', () => {
  beforeEach(() => {
    vi.mocked(createWidgetInstance).mockReturnValue({ ...detachedWidget });
  });

  const createDetachedState = () =>
    widgetsReducer(openOnInputsTab(), detachFilter({ idx: 3, name: 'mp4mx' }));

  const replaceWith = (filterIdx: number, widgetId = 'widget-detached') =>
    replaceDetachedFilter({ widgetId, filterIdx, name: `filter-${filterIdx}` });

  it('keeps the panel identity, geometry and maximized state while reattaching the previous filter', () => {
    const detachedState = createDetachedState();
    const state = {
      ...detachedState,
      configs: {
        ...detachedState.configs,
        'widget-detached': {
          ...detachedState.configs['widget-detached'],
          isMaximized: true,
        },
      },
    };
    const widgetBefore = state.activeWidgets.find(
      (widget) => widget.id === 'widget-detached',
    )!;
    const next = widgetsReducer(state, replaceWith(0));

    expect(next.activeWidgets).toHaveLength(state.activeWidgets.length);
    expect(
      next.activeWidgets.find((widget) => widget.id === widgetBefore.id),
    ).toEqual({ ...widgetBefore, detachedFilterIdx: 0, title: 'filter-0' });
    expect(next.configs).toEqual(state.configs);
    expect(next.viewByFilter[3]).toEqual({
      mode: 'inline',
      activeTab: 'inputs',
    });
    expect(next.viewByFilter[0]).toEqual({
      mode: 'detached',
      widgetId: widgetBefore.id,
    });
  });

  it('restores each filter own tab and metric mode through repeated replacements', () => {
    let state = widgetsReducer(createDetachedState(), openFilterInline(7));
    state = widgetsReducer(
      state,
      setFilterViewState({
        filterIdx: 7,
        patch: { activeTab: 'outputs', pidMetricMode: 'processTime' },
      }),
    );
    state = widgetsReducer(state, replaceWith(7));
    expect(state.viewByFilter[7]).toMatchObject({
      mode: 'detached',
      activeTab: 'outputs',
      pidMetricMode: 'processTime',
    });
    state = widgetsReducer(state, replaceWith(3));
    expect(state.viewByFilter[3]).toMatchObject({
      mode: 'detached',
      activeTab: 'inputs',
    });
    expect(state.viewByFilter[7]).toEqual({
      mode: 'inline',
      activeTab: 'outputs',
      pidMetricMode: 'processTime',
    });
  });

  it('closes the previews of the replaced filter and keeps its tab', () => {
    let state = widgetsReducer(
      createDetachedState(),
      setFilterViewState({
        filterIdx: 3,
        patch: { openPreviews: { input: [0], output: [1] } },
      }),
    );
    state = widgetsReducer(state, replaceWith(7));

    expect(selectFilterOpenPreviews({ widgets: state }, 3)).toEqual({
      input: [],
      output: [],
    });
    expect(state.viewByFilter[3]).toEqual({
      mode: 'inline',
      activeTab: 'inputs',
    });
  });

  it('rejects a filter already detached elsewhere even if dispatched directly', () => {
    const initial = createDetachedState();
    vi.mocked(createWidgetInstance).mockReturnValue({
      ...detachedWidget,
      id: 'other-panel',
    });
    const state = widgetsReducer(
      initial,
      detachFilter({ idx: 7, name: 'vdec' }),
    );
    expect(widgetsReducer(state, replaceWith(7))).toEqual(state);
  });

  it('ignores the current filter, a missing panel and a regular panel', () => {
    const state = createDetachedState();
    expect(widgetsReducer(state, replaceWith(3))).toEqual(state);
    expect(widgetsReducer(state, replaceWith(7, 'missing'))).toEqual(state);
    const regularState = {
      ...state,
      activeWidgets: [{ ...detachedWidget, isDetached: false }],
    };
    expect(widgetsReducer(regularState, replaceWith(7))).toEqual(regularState);
  });

  it('closes only the replacement when its panel is closed', () => {
    const state = widgetsReducer(createDetachedState(), replaceWith(7));
    const next = widgetsReducer(state, {
      type: 'widgets/removeWidget',
      payload: 'widget-detached',
    });
    expect(next.viewByFilter[7]).toBeUndefined();
    expect(next.viewByFilter[3]).toEqual({
      mode: 'inline',
      activeTab: 'inputs',
    });
  });
});
