import React from 'react';
import { GpacNodeData } from '@/types/domain/gpac/model';
import { useFilterStats } from '@/components/views/stats-session/hooks/useFilterStats';
import DetailedStatsView from './DetailedStatsView';

interface FilterTabContentProps {
  filter: GpacNodeData;
  enabled: boolean;
  onBack: () => void;
}

export const FilterTabContent: React.FC<FilterTabContentProps> = ({
  filter,
  enabled,
  onBack,
}) => {
  // subscription live
  const { stats } = useFilterStats(filter.idx, enabled, 1000);

  // merge static + live
  const filterWithStats = React.useMemo(
    () => ({ ...filter, ...stats }),
    [filter, stats],
  );

  return <DetailedStatsView filter={filterWithStats} onBack={onBack} />;
};