import { describe, it, expect, beforeEach, vi } from 'vitest';
import { compact } from 'react-grid-layout/build/utils';
import { createWidgetInstance } from '@/components/widget/registry';
import { WidgetType, type Widget } from '@/types/ui/widget';
import { toLayoutItem } from '../addedWidgetPlacement';
import { GRID_COLUMNS } from '../gridPlacement';
import { addWidgetReducer, detachFilterReducer } from '../widgetUtils';
import { WidgetsState } from '../types';

let createdCount = 0;

const DEFAULT_SIZE_BY_TYPE: Partial<
  Record<WidgetType, { w: number; h: number }>
> = {
  [WidgetType.LOGS]: { w: 18, h: 4 },
  [WidgetType.METRICS]: { w: 6, h: 4 },
};

beforeEach(() => {
  createdCount = 0;
  vi.mocked(createWidgetInstance).mockImplementation((type: WidgetType) => ({
    id: `widget-${createdCount++}`,
    type,
    title: '',
    x: 0,
    y: 0,
    ...(DEFAULT_SIZE_BY_TYPE[type] ?? { w: 11, h: 8 }),
  }));
});

const createBaseWidget = (
  type: WidgetType,
  x: number,
  y: number,
  w: number,
  h: number,
): Widget => ({ id: `base-${type}`, type, title: '', x, y, w, h });

const createState = (activeWidgets: Widget[]): WidgetsState => ({
  activeWidgets,
  configs: {},
  savedLayouts: {},
  viewByFilter: {},
});

const addWidget = (state: WidgetsState, type: WidgetType) =>
  addWidgetReducer(state, { type: 'widgets/addWidget', payload: type });

const findByType = (state: WidgetsState, type: WidgetType) =>
  state.activeWidgets.find((widget) => widget.type === type);

describe('addWidgetReducer placement', () => {
  it('enters the first hole at its default size and moves nothing else', () => {
    const graph = createBaseWidget(WidgetType.GRAPH, 0, 0, 13, 8);
    const filters = createBaseWidget(WidgetType.FILTERSESSION, 13, 0, 11, 8);
    const metrics = createBaseWidget(WidgetType.METRICS, 0, 8, 6, 4);
    const state = createState([{ ...graph }, { ...filters }, { ...metrics }]);

    addWidget(state, WidgetType.LOGS);

    expect(findByType(state, WidgetType.LOGS)).toMatchObject({
      x: 6,
      y: 8,
      w: 18,
      h: 4,
    });
    expect(state.activeWidgets.slice(0, 3)).toEqual([graph, filters, metrics]);
  });

  it('goes to the bottom when no hole is large enough', () => {
    const state = createState([
      createBaseWidget(WidgetType.GRAPH, 0, 0, 13, 8),
      createBaseWidget(WidgetType.FILTERSESSION, 13, 0, 11, 8),
      createBaseWidget(WidgetType.METRICS, 0, 8, 12, 4),
    ]);

    addWidget(state, WidgetType.LOGS);

    expect(findByType(state, WidgetType.LOGS)).toMatchObject({ x: 0, y: 12 });
  });

  it('stores the displayed position of a base widget stored lower', () => {
    const state = createState([
      createBaseWidget(WidgetType.GRAPH, 0, 10, 24, 8),
    ]);

    addWidget(state, WidgetType.METRICS);

    expect(findByType(state, WidgetType.GRAPH)).toMatchObject({ y: 0 });
    expect(findByType(state, WidgetType.METRICS)).toMatchObject({ x: 0, y: 8 });
  });

  it('keeps the position of detached filters when a widget is added', () => {
    const state = createState([
      createBaseWidget(WidgetType.GRAPH, 0, 0, 24, 8),
    ]);
    [0, 1, 2, 3].forEach((idx) =>
      detachFilterReducer(state, {
        type: 'widgets/detachFilter',
        payload: { idx, name: `filter-${idx}` },
      }),
    );
    const lastDetached = state.activeWidgets[4];
    expect(lastDetached).toMatchObject({ x: 0, y: 14 });

    addWidget(state, WidgetType.METRICS);

    expect(lastDetached).toMatchObject({ x: 0, y: 14 });
    expect(findByType(state, WidgetType.METRICS)).toMatchObject({
      x: 8,
      y: 14,
    });
  });

  describe('below eight rows of detached filters', () => {
    const LAST_ROW_DISPLAYED_Y = 42;

    const detachFilters = (state: WidgetsState, count: number) =>
      Array.from({ length: count }).forEach((_, idx) =>
        detachFilterReducer(state, {
          type: 'widgets/detachFilter',
          payload: { idx, name: `filter-${idx}` },
        }),
      );

    const displayedItem = (state: WidgetsState, widgetId: string) =>
      compact(
        state.activeWidgets.map(toLayoutItem),
        'vertical',
        GRID_COLUMNS,
      ).find((item) => item.i === widgetId);

    it('keeps the last row in place when a widget goes to the bottom', () => {
      const state = createState([]);
      detachFilters(state, 24);
      const lastDetached = state.activeWidgets[23];

      addWidget(state, WidgetType.LOGS);

      const logsId = findByType(state, WidgetType.LOGS)!.id;
      expect(displayedItem(state, lastDetached.id)?.y).toBe(
        LAST_ROW_DISPLAYED_Y,
      );
      expect(displayedItem(state, logsId)).toMatchObject({ x: 0, y: 48 });
    });

    it('keeps the last row in place when a second widget fills a hole', () => {
      const state = createState([]);
      detachFilters(state, 24);
      const lastDetached = state.activeWidgets[23];

      addWidget(state, WidgetType.LOGS);
      addWidget(state, WidgetType.METRICS);

      const logsId = findByType(state, WidgetType.LOGS)!.id;
      const metricsId = findByType(state, WidgetType.METRICS)!.id;
      expect(displayedItem(state, lastDetached.id)?.y).toBe(
        LAST_ROW_DISPLAYED_Y,
      );
      expect(displayedItem(state, logsId)).toMatchObject({ x: 0, y: 48 });
      expect(displayedItem(state, metricsId)).toMatchObject({ x: 18, y: 48 });
    });

    it('opens a new detached filter below the added widget', () => {
      const state = createState([]);
      detachFilters(state, 24);

      addWidget(state, WidgetType.LOGS);
      detachFilterReducer(state, {
        type: 'widgets/detachFilter',
        payload: { idx: 24, name: 'filter-24' },
      });

      const newDetached = state.activeWidgets.at(-1)!;
      expect(displayedItem(state, newDetached.id)).toMatchObject({
        x: 0,
        y: 52,
      });
    });
  });

  it('still refuses a second widget of the same type', () => {
    const state = createState([createBaseWidget(WidgetType.LOGS, 0, 0, 18, 4)]);

    addWidget(state, WidgetType.LOGS);

    expect(state.activeWidgets).toHaveLength(1);
  });

  describe('Session Filters with a detached filter open', () => {
    const detachFilter = (state: WidgetsState) =>
      detachFilterReducer(state, {
        type: 'widgets/detachFilter',
        payload: { idx: 0, name: 'filter-0' },
      });

    const findSessionFilters = (state: WidgetsState) =>
      state.activeWidgets.filter(
        (widget) =>
          widget.type === WidgetType.FILTERSESSION && !widget.isDetached,
      );

    it('reopens Session Filters and keeps the detached filter', () => {
      const state = createState([
        createBaseWidget(WidgetType.GRAPH, 0, 0, 24, 8),
      ]);
      detachFilter(state);
      const detachedId = state.activeWidgets[1].id;

      addWidget(state, WidgetType.FILTERSESSION);

      expect(findSessionFilters(state)).toHaveLength(1);
      expect(
        state.activeWidgets.some((widget) => widget.id === detachedId),
      ).toBe(true);
    });

    it('still refuses a second Session Filters', () => {
      const state = createState([
        createBaseWidget(WidgetType.FILTERSESSION, 0, 0, 24, 8),
      ]);
      detachFilter(state);

      addWidget(state, WidgetType.FILTERSESSION);

      expect(findSessionFilters(state)).toHaveLength(1);
      expect(state.activeWidgets).toHaveLength(2);
    });
  });
});
