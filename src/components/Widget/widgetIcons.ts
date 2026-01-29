import { WidgetType } from '@/types';
import { LuFileText, LuGauge, LuShare2 } from 'react-icons/lu';
import { TbFilterCog } from 'react-icons/tb';
import { IconType } from 'react-icons';

export const widgetIcons: Record<WidgetType, IconType> = {
  [WidgetType.FILTERSESSION]: TbFilterCog,
  [WidgetType.GRAPH]: LuShare2,
  [WidgetType.METRICS]: LuGauge,
  [WidgetType.LOGS]: LuFileText,
};
