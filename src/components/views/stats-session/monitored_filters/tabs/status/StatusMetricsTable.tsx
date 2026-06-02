import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { selectSelectedStatusMetric } from '@/shared/store/selectors';
import { setSelectedStatusMetric } from '@/shared/store/slices/monitoredFilterSlice';
import type { NumericMetric } from '../../utils/statusViewModel';
import { TableSection, MetricRow } from '../pid/shared';

interface StatusMetricsTableProps {
  metrics: NumericMetric[];
  filterIdx: number;
}

function GraphRadio({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`Graph ${label}`}
      className={`mr-1.5 align-middle text-[11px] leading-none transition-colors ${
        active ? 'text-info' : 'text-muted-foreground/50 hover:text-info'
      }`}
    >
      {active ? '◉' : '○'}
    </button>
  );
}

function StatusMetricsTable({ metrics, filterIdx }: StatusMetricsTableProps) {
  const dispatch = useAppDispatch();
  const selectedKey = useAppSelector((state) =>
    selectSelectedStatusMetric(state, filterIdx),
  );

  if (metrics.length === 0) return null;

  return (
    <TableSection title="Metrics">
      {metrics.map((metric, index) => (
        <MetricRow
          key={metric.key}
          label={metric.key}
          value={metric.value}
          isEven={index % 2 === 0}
          title={metric.tooltip}
          leading={
            metric.graphable ? (
              <GraphRadio
                active={selectedKey === metric.key}
                label={metric.key}
                onClick={() =>
                  dispatch(
                    setSelectedStatusMetric({
                      filterIdx,
                      metricKey: metric.key,
                    }),
                  )
                }
              />
            ) : undefined
          }
        />
      ))}
    </TableSection>
  );
}

export default StatusMetricsTable;
