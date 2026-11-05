import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createWidgetInstance } from '@/components/widget/registry';
import { WidgetType, type Widget } from '@/types/ui/widget';
import {
  detachFilterReducer,
  openFilterInlineReducer,
  removeWidgetReducer,
  updateWidgetPositionReducer,
} from '../widgetUtils';
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

const baseWidget: Widget = {
  id: 'base-widget',
  type: WidgetType.LOGS,
  title: 'Logs',
  x: 0,
  y: 0,
  w: 24,
  h: 8,
};

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
  filterIndexes.forEach((idx) =>
    detachFilterReducer(state, {
      type: 'widgets/detachFilter',
      payload: { idx, name: `filter-${idx}` },
    }),
  );
  return state;
};

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

  it('pulls the next row up when a slot of the first row is freed', () => {
    const state = createStateWithDetachedFilters([0, 1, 2, 3]);
    expect(findDetached(state, 3)).toMatchObject({ x: 0, y: 6 });

    removeDetached(state, 0);

    expect(findDetached(state, 3)).toMatchObject({ x: 16, y: 0 });
  });

  it('moves a manually placed widget back to a slot, in visual order', () => {
    const state = createStateWithDetachedFilters([0, 1, 2]);
    updateWidgetPositionReducer(state, {
      type: 'widgets/updateWidgetPosition',
      payload: { id: findDetached(state, 1).id, x: 3, y: 20, w: 12, h: 9 },
    });

    removeDetached(state, 0);

    expect(findDetached(state, 2)).toMatchObject({ x: 0, y: 0 });
    expect(findDetached(state, 1)).toMatchObject({ x: 8, y: 0, w: 8, h: 6 });
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

  it('does not reflow when a base widget is closed', () => {
    const state = createStateWithDetachedFilters([0, 1], [baseWidget]);

    removeWidgetReducer(state, {
      type: 'widgets/removeWidget',
      payload: baseWidget.id,
    });

    expect(findDetached(state, 0)).toMatchObject({ x: 0, y: 8 });
    expect(findDetached(state, 1)).toMatchObject({ x: 8, y: 8 });
  });
});
