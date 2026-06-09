import { useLayoutEffect } from 'react';
import { LuInfo } from 'react-icons/lu';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import {
  selectSelectedStatusMetric,
  selectMetricDefinitions,
} from '@/shared/store/selectors';
import { setSelectedStatusMetric } from '@/shared/store/slices/monitoredFilterSlice';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  SeriesLegend,
  type SeriesLegendItem,
} from '@/components/common/charts';
import type { NumericMetric } from '../../utils/statusViewModel';
import { PID_SELECTION_COLORS } from '../pid/utils/pidColors';
import StatusMetricTooltip from './StatusMetricTooltip';

interface StatusMetricSelectorProps {
  metrics: NumericMetric[];
  filterIdx: number;
}

function StatusMetricSelector({
  metrics,
  filterIdx,
}: StatusMetricSelectorProps) {
  const dispatch = useAppDispatch();
  const selectedKeys = useAppSelector((state) =>
    selectSelectedStatusMetric(state, filterIdx),
  );
  const definitions = useAppSelector(selectMetricDefinitions);

  const graphable = metrics.filter((metric) => metric.graphable);
  const atMax = selectedKeys.length >= 4;

  useLayoutEffect(() => {
    if (selectedKeys.length === 0 && graphable.length > 0) {
      graphable.slice(0, 4).forEach((metric) => {
        dispatch(setSelectedStatusMetric({ filterIdx, metricKey: metric.key }));
      });
    }
  });

  if (graphable.length === 0) return null;

  const items: SeriesLegendItem[] = graphable.map((metric) => {
    const active = selectedKeys.includes(metric.key);
    const disabled = atMax && !active;
    const def = definitions[metric.key];
    const colorIndex = selectedKeys.indexOf(metric.key);
    const color = active
      ? PID_SELECTION_COLORS[colorIndex % PID_SELECTION_COLORS.length]
      : undefined;
    return {
      key: metric.key,
      label: metric.key,
      color,
      active,
      disabled,
      onToggle: () =>
        dispatch(setSelectedStatusMetric({ filterIdx, metricKey: metric.key })),
      tooltip: def ? (
        <StatusMetricTooltip def={def}>
          <span className="inline-flex cursor-help">
            <LuInfo className="h-3 w-3 opacity-40 hover:opacity-80" />
          </span>
        </StatusMetricTooltip>
      ) : undefined,
    };
  });

  return (
    <TooltipProvider delayDuration={300}>
      <div className="px-2 py-1">
        <SeriesLegend items={items} />
      </div>
    </TooltipProvider>
  );
}

export default StatusMetricSelector;
