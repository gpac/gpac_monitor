import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createWidgetInstance } from '@/components/widget/registry';
import { WidgetType } from '@/types/ui/widget';
import type { WidgetsState } from '../types';
import widgetsReducer, {
  detachFilter,
  openFilterInline,
  openPidPreview,
} from '../widgetsSlice';

const countDetachedWidgets = (state: WidgetsState) =>
  state.activeWidgets.filter((widget) => widget.detachedFilterIdx === 1).length;

const openInputPreview = (pidIdx: number) =>
  openPidPreview({ filterIdx: 1, name: 'reframer', pidIdx, variant: 'input' });

describe('openPidPreview', () => {
  let createdCount = 0;

  beforeEach(() => {
    createdCount = 0;
    vi.mocked(createWidgetInstance).mockImplementation((type: WidgetType) => ({
      id: `widget-${createdCount++}`,
      type,
      title: '',
      x: 0,
      y: 0,
      w: 8,
      h: 6,
    }));
  });

  it('detaches an inline filter, selects its tab and opens the preview', () => {
    let state = widgetsReducer(undefined, { type: 'test/init' });
    state = widgetsReducer(state, openFilterInline(1));
    state = widgetsReducer(state, openInputPreview(1));

    expect(state.viewByFilter[1]).toMatchObject({
      mode: 'detached',
      widgetId: 'widget-0',
      activeTab: 'inputs',
      openPreviews: { input: [1], output: [] },
    });
    expect(countDetachedWidgets(state)).toBe(1);
  });

  it('adds the preview to an already detached filter without a new widget', () => {
    let state = widgetsReducer(undefined, { type: 'test/init' });
    state = widgetsReducer(state, detachFilter({ idx: 1, name: 'reframer' }));
    state = widgetsReducer(state, openInputPreview(0));
    state = widgetsReducer(state, openInputPreview(1));
    state = widgetsReducer(state, openInputPreview(1));

    expect(countDetachedWidgets(state)).toBe(1);
    expect(state.viewByFilter[1]?.openPreviews).toEqual({
      input: [0, 1],
      output: [],
    });
  });
});
