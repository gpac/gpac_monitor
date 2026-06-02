import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { selectSelectedStatusMetric } from '@/shared/store/selectors';
import { setSelectedStatusMetric } from '@/shared/store/slices/monitoredFilterSlice';
import type { NumericMetric } from '../../utils/statusViewModel';
import { TableSection, MetricRow } from '../pid/shared';
import GraphRadio from '../shared/GraphRadio';

interface StatusMetricsTableProps {
  metrics: NumericMetric[];
  filterIdx: number;
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
              <span className="mr-1.5">
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
              </span>
            ) : undefined
          }
        />
      ))}
    </TableSection>
  );
}

export default StatusMetricsTable;
