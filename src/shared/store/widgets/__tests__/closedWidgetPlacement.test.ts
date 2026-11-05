import { describe, it, expect } from 'vitest';
import { compact } from 'react-grid-layout/build/utils';
import { WidgetType, type Widget } from '@/types/ui/widget';
import { toLayoutItem } from '../addedWidgetPlacement';
import { GRID_COLUMNS } from '../detachedPlacement';
import { removeWidgetReducer } from '../widgetUtils';
import { WidgetsState } from '../types';

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

const closeWidget = (state: WidgetsState, type: WidgetType) =>
  removeWidgetReducer(state, {
    type: 'widgets/removeWidget',
    payload: `base-${type}`,
  });

const findByType = (state: WidgetsState, type: WidgetType) =>
  state.activeWidgets.find((widget) => widget.type === type);

const createBranchLayoutState = () =>
  createState([
    createBaseWidget(WidgetType.GRAPH, 0, 0, 13, 8),
    createBaseWidget(WidgetType.FILTERSESSION, 13, 0, 11, 8),
    createBaseWidget(WidgetType.METRICS, 0, 8, 6, 4),
    createBaseWidget(WidgetType.LOGS, 6, 8, 18, 4),
  ]);

describe('removeWidgetReducer slide on close', () => {
  it('slides logs left at its size when metrics closes', () => {
    const state = createBranchLayoutState();

    closeWidget(state, WidgetType.METRICS);

    expect(findByType(state, WidgetType.METRICS)).toBeUndefined();
    expect(findByType(state, WidgetType.LOGS)).toMatchObject({
      x: 0,
      y: 8,
      w: 18,
      h: 4,
    });
  });

  it('slides filters left and keeps the bottom row when graph closes', () => {
    const state = createBranchLayoutState();

    closeWidget(state, WidgetType.GRAPH);

    expect(findByType(state, WidgetType.FILTERSESSION)).toMatchObject({
      x: 0,
      y: 0,
      w: 11,
    });
    expect(findByType(state, WidgetType.METRICS)).toMatchObject({ x: 0, y: 8 });
    expect(findByType(state, WidgetType.LOGS)).toMatchObject({ x: 6, y: 8 });
  });

  it('stores the displayed position of a widget stored lower', () => {
    const state = createState([
      createBaseWidget(WidgetType.METRICS, 0, 20, 6, 4),
      createBaseWidget(WidgetType.LOGS, 6, 30, 18, 4),
    ]);

    closeWidget(state, WidgetType.METRICS);

    expect(findByType(state, WidgetType.LOGS)).toMatchObject({ x: 0, y: 0 });
  });

  it('slides a detached filter on the rows of the closed widget', () => {
    const detached: Widget = {
      ...createBaseWidget(WidgetType.FILTERSESSION, 8, 12, 8, 6),
      id: 'detached',
      isDetached: true,
      detachedFilterIdx: 0,
    };
    const state = createState([
      createBaseWidget(WidgetType.GRAPH, 0, 0, 24, 8),
      createBaseWidget(WidgetType.METRICS, 0, 8, 6, 4),
      detached,
    ]);

    closeWidget(state, WidgetType.METRICS);

    expect(state.activeWidgets[1]).toMatchObject({ x: 0, y: 8 });
  });

  it('keeps the last detached row in place below eight rows', () => {
    const detachedWidgets = Array.from(
      { length: 24 },
      (_, slot): Widget => ({
        ...createBaseWidget(
          WidgetType.FILTERSESSION,
          (slot % 3) * 8,
          Math.floor(slot / 3) * 7,
          8,
          6,
        ),
        id: `detached-${slot}`,
        isDetached: true,
        detachedFilterIdx: slot,
      }),
    );
    const state = createState([
      ...detachedWidgets,
      createBaseWidget(WidgetType.LOGS, 0, 50, 18, 4),
      createBaseWidget(WidgetType.METRICS, 18, 50, 6, 4),
    ]);

    closeWidget(state, WidgetType.LOGS);

    const displayed = compact(
      state.activeWidgets.map(toLayoutItem),
      'vertical',
      GRID_COLUMNS,
    );
    expect(displayed.find((item) => item.i === 'detached-23')?.y).toBe(42);
    expect(
      displayed.find((item) => item.i === `base-${WidgetType.METRICS}`),
    ).toMatchObject({ x: 0, y: 48 });
  });

  it('moves nothing when the widget id is unknown', () => {
    const state = createState([
      createBaseWidget(WidgetType.LOGS, 6, 30, 18, 4),
    ]);

    removeWidgetReducer(state, {
      type: 'widgets/removeWidget',
      payload: 'unknown',
    });

    expect(findByType(state, WidgetType.LOGS)).toMatchObject({ x: 6, y: 30 });
  });
});
