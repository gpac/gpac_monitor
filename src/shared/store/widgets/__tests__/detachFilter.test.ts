import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createWidgetInstance } from '@/components/widget/registry';
import { WidgetType, type Widget } from '@/types/ui/widget';
import widgetsReducer, {
  openFilterInline,
  detachFilter,
  attachFilter,
  closeFilter,
  setFilterViewState,
} from '../widgetsSlice';
import {
  selectFilterActiveTab,
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

beforeEach(() => {
  vi.mocked(createWidgetInstance).mockReturnValue({ ...detachedWidget });
});

const openOnInputsTab = () => {
  let state = widgetsReducer(undefined, { type: 'test/init' });
  state = widgetsReducer(state, openFilterInline(3));
  return widgetsReducer(
    state,
    setFilterViewState({ filterIdx: 3, patch: { activeTab: 'inputs' } }),
  );
};

describe('filter view active tab', () => {
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

  it('ignores a patch for a filter that is not monitored', () => {
    const state = widgetsReducer(
      widgetsReducer(undefined, { type: 'test/init' }),
      setFilterViewState({ filterIdx: 7, patch: { activeTab: 'outputs' } }),
    );

    expect(state.viewByFilter[7]).toBeUndefined();
  });
});
