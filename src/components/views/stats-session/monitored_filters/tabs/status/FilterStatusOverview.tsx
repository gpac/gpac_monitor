import { memo, useEffect, useMemo } from 'react';
import { useAppDispatch } from '@/shared/hooks/redux';
import { clearStatusMetricsByFilter } from '@/shared/store/slices/monitoredFilterSlice';
import type { FilterStatusViewModel } from '../../utils/statusViewModel';
import { getStatusOverviewState } from '../../utils/statusOverviewState';
import { useStatusMetricSamples } from '../hooks/useStatusMetricSamples';
import FilterStatusMetrics from './FilterStatusMetrics';
import StatusSummaryCard from './StatusSummaryCard';
import StatusGraphSection from './StatusGraphSection';

interface FilterStatusOverviewProps {
  groups: FilterStatusViewModel;
  filterIdx: number;
  filterName: string;
}

const FilterStatusOverview = memo(
  ({ groups, filterIdx, filterName }: FilterStatusOverviewProps) => {
    const dispatch = useAppDispatch();
    const state = getStatusOverviewState(groups);

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

    if (state === 'none') return null;
    if (state === 'summary') return <StatusSummaryCard groups={groups} />;

    return (
      <div className="flex flex-col gap-2">
        <FilterStatusMetrics groups={groups} filterIdx={filterIdx} />
        <StatusGraphSection filterIdx={filterIdx} filterName={filterName} />
      </div>
    );
  },
);

FilterStatusOverview.displayName = 'FilterStatusOverview';

export default FilterStatusOverview;
