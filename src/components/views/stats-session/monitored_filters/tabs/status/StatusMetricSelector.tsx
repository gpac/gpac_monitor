import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { selectSelectedStatusMetric } from '@/shared/store/selectors';
import { setSelectedStatusMetric } from '@/shared/store/slices/monitoredFilterSlice';
import type { NumericMetric } from '../../utils/statusViewModel';
import GraphRadio from '../shared/GraphRadio';

interface StatusMetricSelectorProps {
  metrics: NumericMetric[];
  filterIdx: number;
}

function StatusMetricSelector({
  metrics,
  filterIdx,
}: StatusMetricSelectorProps) {
  const dispatch = useAppDispatch();
  const selectedKey = useAppSelector((state) =>
    selectSelectedStatusMetric(state, filterIdx),
  );

  const graphable = metrics.filter((metric) => metric.graphable);
  if (graphable.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-2 py-1">
      {graphable.map((metric) => {
        const active = selectedKey === metric.key;
        const onSelect = () =>
          dispatch(
            setSelectedStatusMetric({ filterIdx, metricKey: metric.key }),
          );
        return (
          <span key={metric.key} className="inline-flex items-center gap-1">
            <GraphRadio active={active} label={metric.key} onClick={onSelect} />
            <button
              type="button"
              onClick={onSelect}
              className={`text-[11px] font-mono leading-none transition-colors ${
                active ? 'text-info' : 'text-muted-foreground hover:text-info'
              }`}
            >
              {metric.key}
            </button>
          </span>
        );
      })}
    </div>
  );
}

export default StatusMetricSelector;
