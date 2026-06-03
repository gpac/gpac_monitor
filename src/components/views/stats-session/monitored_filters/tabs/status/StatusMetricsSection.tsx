import { memo, useEffect, useMemo } from 'react';
import { useAppDispatch } from '@/shared/hooks/redux';
import { clearStatusMetricsByFilter } from '@/shared/store/slices/monitoredFilterSlice';
import type { FilterStatusViewModel } from '../../utils/statusViewModel';
import { useStatusMetricSamples } from '../hooks/useStatusMetricSamples';
import FilterStatusMetrics from '../FilterStatusMetrics';
import StatusGraphSection from './StatusGraphSection';

interface StatusMetricsSectionProps {
  groups: FilterStatusViewModel;
  filterIdx: number;
  filterName: string;
}

const StatusMetricsSection = memo(
  ({ groups, filterIdx, filterName }: StatusMetricsSectionProps) => {
    const dispatch = useAppDispatch();

    const graphableMetrics = useMemo(
      () =>
        groups.numericMetrics
          .filter((metric) => metric.graphable)
          .map((metric) => ({ key: metric.key, rawValue: metric.rawValue })),
      [groups.numericMetrics],
    );

    useStatusMetricSamples(filterIdx, graphableMetrics);

    useEffect(
      () => () => {
        dispatch(clearStatusMetricsByFilter(filterIdx));
      },
      [dispatch, filterIdx],
    );

    return (
      <div className="flex flex-col gap-2">
        <FilterStatusMetrics groups={groups} filterIdx={filterIdx} />
        <StatusGraphSection filterIdx={filterIdx} filterName={filterName} />
      </div>
    );
  },
);

StatusMetricsSection.displayName = 'StatusMetricsSection';

export default StatusMetricsSection;
