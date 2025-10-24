import React from 'react';
import {
  OverviewTabData,
  BuffersTabData,
  TabPIDData,
  NetworkTabData,
  FilterStatsResponse,
} from '@/types/domain/gpac/filter-stats';
import DetailedStatsView from '../DetailedStatsView';

interface FilterTabContentProps {
  overviewData: OverviewTabData;
  networkData: NetworkTabData;
  buffersData: BuffersTabData;
  inputPids: TabPIDData[];
  outputPids: TabPIDData[];
  filterData?: FilterStatsResponse;
  onBack: () => void;
  onOpenProperties: () => void;
}

export const FilterTabContent: React.FC<FilterTabContentProps> = ({
  overviewData,
  networkData,
  buffersData,
  inputPids,
  outputPids,
  filterData,
  onBack,
  onOpenProperties,
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
      onOpenProperties={onOpenProperties}
    />
  );
};
