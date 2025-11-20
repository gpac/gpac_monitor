import React from 'react';
import {
  OverviewTabData,
  BuffersTabData,
  TabPIDData,
  NetworkTabData,
  FilterStatsResponse,
} from '@/types/domain/gpac/filter-stats';
import type { InitialTabType } from '@/shared/store/slices/graphSlice';
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
  initialTab?: InitialTabType;
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
}) => {
  // Don't pass filterData if undefined, let DetailedStatsView use its default
  const props = {
    overviewData,
    networkData,
    inputPids,
    outputPids,
    onBack,
    onOpenProperties,
    initialTab,
    ...(filterData && { filterData }), // Only pass if defined
  };

  return <DetailedStatsView {...props} />;
};
