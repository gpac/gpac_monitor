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
  // Don't pass filterData if undefined, let DetailedStatsView use its default
  const props = {
    overviewData,
    networkData,
    buffersData,
    inputPids,
    outputPids,
    onBack,
    onOpenProperties,
    ...(filterData && { filterData }), // Only pass if defined
  };

  return <DetailedStatsView {...props} />;
};
