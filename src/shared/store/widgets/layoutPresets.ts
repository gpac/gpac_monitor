import { createWidgetInstance } from '@/components/widget/registry';
import { WidgetType, type Widget } from '@/types/ui/widget';
import type { LayoutState } from './types';
import { isWidgetAvailable } from './widgetAvailability';

type PresetWidget = Pick<Widget, 'type' | 'x' | 'y' | 'w' | 'h'>;

// Edit this catalogue to change the supplied layouts. User saves take priority.
export const layoutPresets: Record<string, PresetWidget[]> = {
  Playback: [
    { type: WidgetType.FILTERSESSION, x: 0, y: 0, w: 16, h: 8 },
    { type: WidgetType.METRICS, x: 16, y: 0, w: 8, h: 8 },
    { type: WidgetType.LOGS, x: 0, y: 8, w: 24, h: 4 },
  ],
  Dashboard: [
    { type: WidgetType.METRICS, x: 0, y: 0, w: 8, h: 8 },
    { type: WidgetType.FILTERSESSION, x: 8, y: 0, w: 16, h: 8 },
    { type: WidgetType.LOGS, x: 0, y: 8, w: 24, h: 4 },
  ],
  Preview: [
    { type: WidgetType.PREVIEWS, x: 0, y: 0, w: 6, h: 6 },
    { type: WidgetType.FILTERSESSION, x: 6, y: 0, w: 12, h: 6 },
    { type: WidgetType.LOGS, x: 18, y: 0, w: 6, h: 6 },
  ],
  Transcoding: [
    { type: WidgetType.GRAPH, x: 0, y: 0, w: 14, h: 8 },
    { type: WidgetType.FILTERSESSION, x: 14, y: 0, w: 10, h: 8 },
    { type: WidgetType.METRICS, x: 0, y: 8, w: 6, h: 4 },
    { type: WidgetType.LOGS, x: 6, y: 8, w: 18, h: 4 },
  ],
};

export const getPresetNames = (isHistory: boolean): string[] =>
  Object.keys(layoutPresets).filter((name) =>
    layoutPresets[name].every((placement) =>
      isWidgetAvailable(placement.type, isHistory),
    ),
  );

export function getLayoutPreset(name: string): LayoutState | undefined {
  if (!Object.prototype.hasOwnProperty.call(layoutPresets, name)) return;

  const widgets = layoutPresets[name].flatMap((placement) => {
    const widget = createWidgetInstance(placement.type);
    return widget ? [{ ...widget, ...placement }] : [];
  });

  return {
    name,
    widgets,
    configs: Object.fromEntries(
      widgets.map((widget) => [
        widget.id,
        { isMaximized: false, isMinimized: false, settings: {} },
      ]),
    ),
    createdAt: '2026-10-09T00:00:00.000Z',
  };
}
