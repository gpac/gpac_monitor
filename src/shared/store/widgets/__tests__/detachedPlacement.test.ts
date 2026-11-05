import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createWidgetInstance } from '@/components/widget/registry';
import { WidgetType, type Widget } from '@/types/ui/widget';
import {
  detachFilterReducer,
  openFilterInlineReducer,
  removeWidgetReducer,
  updateWidgetPositionReducer,
} from '../widgetUtils';
import { getLayoutPreset } from '../layoutPresets';
import { WidgetsState } from '../types';

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

const detach = (state: WidgetsState, idx: number) =>
  detachFilterReducer(state, {
    type: 'widgets/detachFilter',
    payload: { idx, name: `filter-${idx}` },
  });

const createStateWithDetachedFilters = (
  filterIndexes: number[],
  baseWidgets: Widget[] = [],
): WidgetsState => {
  const state: WidgetsState = {
    activeWidgets: baseWidgets.map((widget) => ({ ...widget })),
    configs: {},
    savedLayouts: {},
    viewByFilter: {},
  };
  filterIndexes.forEach((idx) => detach(state, idx));
  return state;
};

const createPresetStateWithDetachedFilters = (
  filterIndexes: number[],
  presetName = 'Default',
) =>
  createStateWithDetachedFilters(
    filterIndexes,
    getLayoutPreset(presetName)!.widgets,
  );

const findByType = (state: WidgetsState, type: WidgetType) =>
  state.activeWidgets.find((widget) => widget.type === type)!;

const closeWidgetOfType = (state: WidgetsState, type: WidgetType) =>
  removeWidgetReducer(state, {
    type: 'widgets/removeWidget',
    payload: findByType(state, type).id,
  });

const findDetached = (state: WidgetsState, idx: number) =>
  state.activeWidgets.find((widget) => widget.detachedFilterIdx === idx)!;

const removeDetached = (state: WidgetsState, idx: number) =>
  removeWidgetReducer(state, {
    type: 'widgets/removeWidget',
    payload: findDetached(state, idx).id,
  });

describe('detached widgets reflow', () => {
  it('moves the remaining widgets left when the first one is closed', () => {
    const state = createStateWithDetachedFilters([0, 1, 2]);
    const secondWidgetId = findDetached(state, 1).id;

    removeDetached(state, 0);

    expect(findDetached(state, 1)).toMatchObject({
      id: secondWidgetId,
      x: 0,
      y: 0,
    });
    expect(findDetached(state, 2)).toMatchObject({ x: 8, y: 0 });
  });

  it('leaves the other widgets in place when the last one is closed', () => {
    const state = createStateWithDetachedFilters([0, 1, 2]);

    removeDetached(state, 2);

    expect(findDetached(state, 0)).toMatchObject({ x: 0, y: 0 });
    expect(findDetached(state, 1)).toMatchObject({ x: 8, y: 0 });
  });

  it('keeps the next row below when a slot of the first row is freed', () => {
    const state = createPresetStateWithDetachedFilters([0, 1, 2, 3]);

    removeDetached(state, 0);

    expect(findDetached(state, 1)).toMatchObject({ x: 0, y: 12 });
    expect(findDetached(state, 2)).toMatchObject({ x: 8, y: 12 });
    expect(findDetached(state, 3)).toMatchObject({ x: 0, y: 18 });
  });

  it('gives the freed hole to the next detached filter', () => {
    const state = createPresetStateWithDetachedFilters([0, 1, 2, 3]);

    removeDetached(state, 0);
    detach(state, 4);

    expect(findDetached(state, 4)).toMatchObject({ x: 16, y: 12 });
  });

  it('moves up only the widget right under the hole', () => {
    const state = createPresetStateWithDetachedFilters([0, 1, 2, 3, 4, 5]);

    removeDetached(state, 0);

    expect(findDetached(state, 5)).toMatchObject({ x: 16, y: 12 });
    expect(findDetached(state, 3)).toMatchObject({ x: 0, y: 18 });
    expect(findDetached(state, 4)).toMatchObject({ x: 8, y: 18 });
  });

  it('keeps the place and size of a manually placed widget', () => {
    const state = createPresetStateWithDetachedFilters([0, 1, 2]);
    updateWidgetPositionReducer(state, {
      type: 'widgets/updateWidgetPosition',
      payload: { id: findDetached(state, 2).id, x: 3, y: 18, w: 12, h: 9 },
    });

    removeDetached(state, 0);

    expect(findDetached(state, 1)).toMatchObject({ x: 0, y: 12 });
    expect(findDetached(state, 2)).toMatchObject({ x: 3, y: 18, w: 12, h: 9 });
  });

  it('reflows when a detached filter is reopened inline', () => {
    const state = createStateWithDetachedFilters([0, 1]);

    openFilterInlineReducer(state, {
      type: 'widgets/openFilterInline',
      payload: 0,
    });

    expect(findDetached(state, 1)).toMatchObject({ x: 0, y: 0 });
  });

  it('places a new detached widget after the reflowed ones', () => {
    const state = createStateWithDetachedFilters([0, 1, 2]);

    removeDetached(state, 0);
    detachFilterReducer(state, {
      type: 'widgets/detachFilter',
      payload: { idx: 3, name: 'filter-3' },
    });

    expect(findDetached(state, 3)).toMatchObject({ x: 16, y: 0 });
  });

  it('slides a detached filter left when Graph is closed', () => {
    const state = createPresetStateWithDetachedFilters([]);
    closeWidgetOfType(state, WidgetType.LOGS);
    detach(state, 0);
    expect(findDetached(state, 0)).toMatchObject({ x: 16, y: 6 });

    closeWidgetOfType(state, WidgetType.GRAPH);

    expect(findDetached(state, 0)).toMatchObject({ x: 0, y: 6 });
  });

  it('moves up a detached filter with nothing above it when Graph is closed', () => {
    const state = createPresetStateWithDetachedFilters([0, 1]);

    closeWidgetOfType(state, WidgetType.GRAPH);

    expect(findByType(state, WidgetType.LOGS)).toMatchObject({ x: 0, y: 6 });
    expect(findDetached(state, 1)).toMatchObject({ x: 8, y: 6 });
    expect(findDetached(state, 0)).toMatchObject({ x: 0, y: 12 });
  });

  it('moves the widget under Logs into its place when Logs is closed', () => {
    const state = createPresetStateWithDetachedFilters([0, 1, 2]);

    closeWidgetOfType(state, WidgetType.LOGS);

    expect(findDetached(state, 2)).toMatchObject({ x: 16, y: 6 });
    expect(findDetached(state, 0)).toMatchObject({ x: 0, y: 12 });
    expect(findDetached(state, 1)).toMatchObject({ x: 8, y: 12 });
  });

  it('keeps Metrics and Logs below when Graph is closed on Dashboard', () => {
    const state = createPresetStateWithDetachedFilters([], 'Dashboard');

    closeWidgetOfType(state, WidgetType.GRAPH);

    expect(findByType(state, WidgetType.FILTERSESSION)).toMatchObject({
      x: 0,
      y: 0,
    });
    expect(findByType(state, WidgetType.METRICS)).toMatchObject({ x: 0, y: 8 });
    expect(findByType(state, WidgetType.LOGS)).toMatchObject({ x: 6, y: 8 });
  });
});
