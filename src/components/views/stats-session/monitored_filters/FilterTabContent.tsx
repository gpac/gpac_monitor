import React from 'react';
import { OverviewTabData, BuffersTabData, TabPIDData, NetworkTabData } from '@/types/domain/gpac/filter-stats';
import DetailedStatsView from './DetailedStatsView';

interface FilterTabContentProps {
  overviewData: OverviewTabData;
  networkData: NetworkTabData;
  buffersData: BuffersTabData;
  inputPids: TabPIDData[];
  outputPids: TabPIDData[];
  onBack: () => void;
}

export const FilterTabContent: React.FC<FilterTabContentProps> = ({
  overviewData,
  networkData,
  buffersData,
  inputPids,
  outputPids,
  onBack,
}) => {
  return (
    <DetailedStatsView 
      overviewData={overviewData}
      networkData={networkData}
      buffersData={buffersData}
      inputPids={inputPids}
      outputPids={outputPids}
      onBack={onBack} 
    />
  );
};