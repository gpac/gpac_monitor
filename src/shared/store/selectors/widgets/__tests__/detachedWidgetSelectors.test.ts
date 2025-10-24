import { describe, it, expect } from 'vitest';
import {
  selectIsFilterDetached,
  selectDetachedWidgetByFilter,
  selectDetachedWidgetCount,
  selectAllDetachedWidgets,
} from '../detachedWidgetSelectors';
import { RootState } from '../../../slices/widgetsSlice';
import { WidgetType } from '@/types/ui/widget';
import { Widget } from '@/types/ui/widget';

const createMockWidget = (overrides?: Partial<Widget>): Widget => ({
  id: 'widget-1',
  type: WidgetType.FILTERSESSION,
  title: 'Filter 1',
  x: 0,
  y: 0,
  w: 6,
  h: 6,
  ...overrides,
});

const createMockState = (activeWidgets: Widget[]): RootState => ({
  widgets: {
    activeWidgets,
    configs: {},
    savedLayouts: {},
    selectedNode: null,
  },
});

describe('detachedWidgetSelectors', () => {
  describe('selectIsFilterDetached', () => {
    it('should return true when filter has a detached widget', () => {
      const widgets = [
        createMockWidget({
          isDetached: true,
          detachedFilterIdx: 0,
        }),
      ];
      const state = createMockState(widgets);

      const result = selectIsFilterDetached(state, 0);
      expect(result).toBe(true);
    });

    it('should return false when filter has no detached widget', () => {
      const widgets = [createMockWidget({ isDetached: false })];
      const state = createMockState(widgets);

      const result = selectIsFilterDetached(state, 0);
      expect(result).toBe(false);
    });

    it('should return false for different filter indices', () => {
      const widgets = [
        createMockWidget({
          isDetached: true,
          detachedFilterIdx: 0,
        }),
      ];
      const state = createMockState(widgets);

      const result = selectIsFilterDetached(state, 1);
      expect(result).toBe(false);
    });

    it('should handle empty widget list', () => {
      const state = createMockState([]);

      const result = selectIsFilterDetached(state, 0);
      expect(result).toBe(false);
    });
  });

  describe('selectDetachedWidgetByFilter', () => {
    it('should return widget ID when detached widget exists', () => {
      const widgetId = 'detached-widget-123';
      const widgets = [
        createMockWidget({
          id: widgetId,
          isDetached: true,
          detachedFilterIdx: 0,
        }),
      ];
      const state = createMockState(widgets);

      const result = selectDetachedWidgetByFilter(state, 0);
      expect(result).toBe(widgetId);
    });

    it('should return null when no detached widget exists', () => {
      const widgets = [createMockWidget({ isDetached: false })];
      const state = createMockState(widgets);

      const result = selectDetachedWidgetByFilter(state, 0);
      expect(result).toBeNull();
    });

    it('should return null for different filter indices', () => {
      const widgets = [
        createMockWidget({
          isDetached: true,
          detachedFilterIdx: 0,
        }),
      ];
      const state = createMockState(widgets);

      const result = selectDetachedWidgetByFilter(state, 1);
      expect(result).toBeNull();
    });
  });

  describe('selectDetachedWidgetCount', () => {
    it('should count all detached widgets', () => {
      const widgets = [
        createMockWidget({
          id: 'widget-1',
          isDetached: true,
          detachedFilterIdx: 0,
        }),
        createMockWidget({
          id: 'widget-2',
          isDetached: true,
          detachedFilterIdx: 1,
        }),
        createMockWidget({
          id: 'widget-3',
          isDetached: false,
        }),
      ];
      const state = createMockState(widgets);

      const result = selectDetachedWidgetCount(state);
      expect(result).toBe(2);
    });

    it('should return 0 when no detached widgets exist', () => {
      const widgets = [
        createMockWidget({ isDetached: false }),
        createMockWidget({ isDetached: false }),
      ];
      const state = createMockState(widgets);

      const result = selectDetachedWidgetCount(state);
      expect(result).toBe(0);
    });

    it('should return 0 for empty widget list', () => {
      const state = createMockState([]);

      const result = selectDetachedWidgetCount(state);
      expect(result).toBe(0);
    });
  });

  describe('selectAllDetachedWidgets', () => {
    it('should return all detached widgets', () => {
      const detachedWidget1 = createMockWidget({
        id: 'widget-1',
        isDetached: true,
        detachedFilterIdx: 0,
      });
      const detachedWidget2 = createMockWidget({
        id: 'widget-2',
        isDetached: true,
        detachedFilterIdx: 1,
      });
      const normalWidget = createMockWidget({
        id: 'widget-3',
        isDetached: false,
      });

      const widgets = [detachedWidget1, normalWidget, detachedWidget2];
      const state = createMockState(widgets);

      const result = selectAllDetachedWidgets(state);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(detachedWidget1);
      expect(result).toContainEqual(detachedWidget2);
      expect(result).not.toContainEqual(normalWidget);
    });

    it('should return empty array when no detached widgets exist', () => {
      const widgets = [
        createMockWidget({ isDetached: false }),
        createMockWidget({ isDetached: false }),
      ];
      const state = createMockState(widgets);

      const result = selectAllDetachedWidgets(state);
      expect(result).toHaveLength(0);
    });

    it('should return empty array for empty widget list', () => {
      const state = createMockState([]);

      const result = selectAllDetachedWidgets(state);
      expect(result).toHaveLength(0);
    });
  });
});
