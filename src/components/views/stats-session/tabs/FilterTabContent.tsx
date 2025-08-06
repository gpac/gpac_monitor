import React from 'react';
import { OverviewTabData, BuffersTabData, TabPIDData, NetworkTabData } from '@/types/domain/gpac/filter-stats';
import { FilterTabContent as DetailedFilterTabContent } from '../monitored_filters/FilterTabContent';

interface FilterTabContentProps {
  overviewData: OverviewTabData;
  networkData: NetworkTabData;
  buffersData: BuffersTabData;
  inputPids: TabPIDData[];
  outputPids: TabPIDData[];
  onCardClick: (idx: number) => void;
  isMonitored: boolean;
}

export const FilterTabContent: React.FC<FilterTabContentProps> = ({
  overviewData,
  networkData,
  buffersData,
  inputPids,
  outputPids,
  onCardClick,
}) => {
  const handleBack = () => {
    // Navigate back to the main dashboard view
    onCardClick(-1); // Special value to indicate going back to dashboard
  };

  return (
    <div className="p-4">
      <DetailedFilterTabContent
        overviewData={overviewData}
        networkData={networkData}
        buffersData={buffersData}
        inputPids={inputPids}
        outputPids={outputPids}
        onBack={handleBack}
      />
    </div>
  );
};
