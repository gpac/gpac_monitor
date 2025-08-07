import React from 'react';
import { OverviewTabData, BuffersTabData, TabPIDData, NetworkTabData, FilterStatsResponse } from '@/types/domain/gpac/filter-stats';
import DetailedStatsView from '../DetailedStatsView';

interface FilterTabContentProps {
  overviewData: OverviewTabData;
  networkData: NetworkTabData;
  buffersData: BuffersTabData;
  inputPids: TabPIDData[];
  outputPids: TabPIDData[];
  filterData?: FilterStatsResponse; // Added for direct filter stats access
  onBack: () => void;
}

export const FilterTabContent: React.FC<FilterTabContentProps> = ({
  overviewData,
  networkData,
  buffersData,
  inputPids,
  outputPids,
  filterData,
  onBack,
}) => {
  return (
    <DetailedStatsView 
      overviewData={overviewData}
      networkData={networkData}
      buffersData={buffersData}
      inputPids={inputPids}
      outputPids={outputPids}
      filterData={filterData}
      onBack={onBack} 
    />
  );
};