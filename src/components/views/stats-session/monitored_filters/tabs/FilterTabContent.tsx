import React from 'react';
import { OverviewTabData, TabPIDData, NetworkTabData } from '@/types/ui';
import { FilterStatsResponse } from '@/types/domain/gpac/filter-stats';
import type { InitialTabType } from '@/shared/store/slices/graphSlice';
import MonitoredFilterView from '../MonitoredFilterView';

interface FilterTabContentProps {
  overviewData: OverviewTabData;
  networkData: NetworkTabData;
  inputPids: TabPIDData[];
  outputPids: TabPIDData[];
  filterData?: FilterStatsResponse;
  onBack: () => void;
  onOpenProperties: () => void;
  initialTab?: InitialTabType;
  isLoading?: boolean;
  isDetached?: boolean;
}

export const FilterTabContent: React.FC<FilterTabContentProps> = ({
  overviewData,
  networkData,
  inputPids,
  outputPids,
  filterData,
  onBack,
  onOpenProperties,
  initialTab,
  isLoading = false,
  isDetached = false,
}) => {
  const props = {
    overviewData,
    networkData,
    inputPids,
    outputPids,
    onBack,
    onOpenProperties,
    initialTab,
    isLoading,
    isDetached,
    ...(filterData && { filterData }),
  };

  return <MonitoredFilterView {...props} />;
};
