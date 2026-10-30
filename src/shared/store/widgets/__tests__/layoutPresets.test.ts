import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWidgetInstance } from '@/components/widget/registry';
import { WidgetType } from '@/types/ui/widget';
import {
  getLayoutPreset,
  getPresetNames,
  layoutPresets,
} from '../layoutPresets';
import { isWidgetAvailable } from '../widgetAvailability';
import {
  loadLayoutReducer,
  saveLayoutReducer,
  deleteLayoutReducer,
} from '../widgetUtils';
import type { WidgetsState } from '../types';

function emptyState(): WidgetsState {
  return { activeWidgets: [], configs: {}, savedLayouts: {}, viewByFilter: {} };
}

beforeEach(() => {
  window.localStorage.clear();
  vi.resetModules();
  vi.mocked(createWidgetInstance).mockImplementation((type) => ({
    id: type,
    type,
    title: type,
    x: 0,
    y: 0,
    w: 6,
    h: 4,
  }));
});

describe('default layout presets', () => {
  it('loads all four without adding saved layouts', () => {
    expect(Object.keys(layoutPresets)).toEqual([
      'Playback',
      'Dashboard',
      'Preview',
      'Transcoding',
    ]);
    for (const name of Object.keys(layoutPresets)) {
      const state = emptyState();
      loadLayoutReducer(state, { type: 'loadLayout', payload: name });
      expect(state.activeWidgets.length).toBeGreaterThan(0);
      expect(state.currentLayout).toBe(name);
      expect(state.savedLayouts).toEqual({});
    }
    expect(
      getLayoutPreset('Preview')?.widgets.some(
        (widget) => widget.type === WidgetType.GRAPH,
      ),
    ).toBe(false);
    expect(
      getLayoutPreset('Preview')?.widgets.map((widget) => [
        widget.type,
        widget.y,
      ]),
    ).toEqual([
      [WidgetType.PREVIEWS, 0],
      [WidgetType.FILTERSESSION, 0],
      [WidgetType.LOGS, 0],
    ]);
    expect(getLayoutPreset('unknown')).toBeUndefined();
  });

  it('hides the live-only Previews widget and its preset in history', () => {
    expect(isWidgetAvailable(WidgetType.PREVIEWS, true)).toBe(false);
    expect(isWidgetAvailable(WidgetType.PREVIEWS, false)).toBe(true);
    expect(isWidgetAvailable(WidgetType.LOGS, true)).toBe(true);
    expect(getPresetNames(false)).toEqual(Object.keys(layoutPresets));
    expect(getPresetNames(true)).toEqual([
      'Playback',
      'Dashboard',
      'Transcoding',
    ]);
  });

  it('keeps personal versions and restores the default after deletion', () => {
    const state = emptyState();
    loadLayoutReducer(state, { type: 'loadLayout', payload: 'Preview' });
    state.activeWidgets[0].h = 12;
    state.configs[state.activeWidgets[0].id].settings.custom = true;
    saveLayoutReducer(state, { type: 'saveLayout', payload: 'Preview' });
    saveLayoutReducer(state, { type: 'saveLayout', payload: 'My layout' });
    const personalLayout = structuredClone(state.savedLayouts['My layout']);
    loadLayoutReducer(state, { type: 'loadLayout', payload: 'Transcoding' });
    loadLayoutReducer(state, { type: 'loadLayout', payload: 'Preview' });
    expect(state.activeWidgets[0].h).toBe(12);
    expect(state.configs[state.activeWidgets[0].id].settings.custom).toBe(true);
    state.activeWidgets[0].h = 14;
    expect(state.savedLayouts.Preview.widgets[0].h).toBe(12);
    expect(getLayoutPreset('Preview')?.widgets[0].h).toBe(6);
    deleteLayoutReducer(state, { type: 'deleteLayout', payload: 'Preview' });
    loadLayoutReducer(state, { type: 'loadLayout', payload: 'Preview' });
    expect(state.activeWidgets[0].h).toBe(6);
    expect(state.savedLayouts['My layout']).toEqual(personalLayout);
  });

  it('restores a default preset on startup without a saved copy', async () => {
    window.localStorage.setItem('gpac_monitor_last_layout_v1', 'Preview');
    const { initialState } = await import('../widgetsInitialState');
    expect(initialState.currentLayout).toBe('Preview');
    expect(initialState.activeWidgets).toHaveLength(3);
    expect(initialState.savedLayouts).toEqual({});
    expect(window.localStorage.getItem('gpac_monitor_layout_v1')).toBeNull();
  });

  it('restores a customized preset before the supplied default on startup', async () => {
    const customized = getLayoutPreset('Playback')!;
    customized.widgets[0].h = 12;
    window.localStorage.setItem(
      'gpac_monitor_layout_v1',
      JSON.stringify({ Playback: customized }),
    );
    window.localStorage.setItem('gpac_monitor_last_layout_v1', 'Playback');
    const { initialState } = await import('../widgetsInitialState');
    expect(initialState.activeWidgets[0].h).toBe(12);
    expect(initialState.savedLayouts.Playback).toEqual(customized);
  });
});
