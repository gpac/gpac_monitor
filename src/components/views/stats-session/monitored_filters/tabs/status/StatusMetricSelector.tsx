import { useLayoutEffect } from 'react';
import { LuInfo } from 'react-icons/lu';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import {
  selectSelectedStatusMetric,
  selectMetricDefinitions,
} from '@/shared/store/selectors';
import { setSelectedStatusMetric } from '@/shared/store/slices/monitoredFilterSlice';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { NumericMetric } from '../../utils/statusViewModel';
import GraphRadio from '../shared/GraphRadio';
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

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-2 py-1">
        {graphable.map((metric) => {
          const active = selectedKeys.includes(metric.key);
          const disabled = atMax && !active;
          const def = definitions[metric.key];
          const onToggle = () =>
            dispatch(
              setSelectedStatusMetric({ filterIdx, metricKey: metric.key }),
            );
          return (
            <span
              key={metric.key}
              className={`inline-flex items-center gap-1 ${disabled ? 'opacity-40' : ''}`}
            >
              <GraphRadio
                active={active}
                label={metric.key}
                onClick={disabled ? () => {} : onToggle}
              />
              <button
                type="button"
                onClick={disabled ? undefined : onToggle}
                disabled={disabled}
                className={`text-[11px] font-mono leading-none transition-colors ${
                  active ? 'text-info' : 'text-muted-foreground hover:text-info'
                }`}
              >
                {metric.key}
              </button>
              {def && (
                <StatusMetricTooltip def={def}>
                  <span className="inline-flex cursor-help">
                    <LuInfo className="h-3 w-3 opacity-40 hover:opacity-80" />
                  </span>
                </StatusMetricTooltip>
              )}
            </span>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

export default StatusMetricSelector;
