import { WidgetType } from '@/types/ui/widget';

const LIVE_ONLY_WIDGETS: ReadonlySet<WidgetType> = new Set([
  WidgetType.PREVIEWS,
]);

export const isWidgetAvailable = (
  type: WidgetType,
  isHistory: boolean,
): boolean => !isHistory || !LIVE_ONLY_WIDGETS.has(type);
