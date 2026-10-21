import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createWidgetInstance } from '@/components/widget/registry';
import { WidgetType } from '@/types/ui/widget';
import { detachFilterReducer, removeWidgetReducer } from '../widgetUtils';
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

describe('detachFilterReducer', () => {
  it('places a new detached widget in the slot freed by a removed one', () => {
    const state = createEmptyState();
    detach(state, 0);
    detach(state, 1);
    detach(state, 2);

    const firstWidget = findDetachedWidget(state, 0);
    removeWidgetReducer(state, {
      type: 'widgets/removeWidget',
      payload: firstWidget!.id,
    });
    detach(state, 3);

    const newWidget = findDetachedWidget(state, 3);
    expect(newWidget).toMatchObject({ x: 0, y: 0 });
  });

  it('places widgets side by side when no slot was freed', () => {
    const state = createEmptyState();
    detach(state, 0);
    detach(state, 1);

    expect(findDetachedWidget(state, 1)).toMatchObject({ x: 8, y: 0 });
  });
});
