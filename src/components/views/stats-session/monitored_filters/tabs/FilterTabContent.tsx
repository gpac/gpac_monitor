import React, { memo } from 'react';
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

export const FilterTabContent: React.FC<FilterTabContentProps> = memo(
  ({
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
  }) => (
    <MonitoredFilterView
      overviewData={overviewData}
      networkData={networkData}
      inputPids={inputPids}
      outputPids={outputPids}
      filterData={filterData}
      onBack={onBack}
      onOpenProperties={onOpenProperties}
      initialTab={initialTab}
      isLoading={isLoading}
      isDetached={isDetached}
    />
  ),
);

FilterTabContent.displayName = 'FilterTabContent';
