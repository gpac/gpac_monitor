import React from 'react';
import type { EnrichedFilterOverview } from '@/types/domain/gpac/model';
import { FilterTabContent as DetailedFilterTabContent } from '../monitored_filters/FilterTabContent';

interface FilterTabContentProps {
  filter: EnrichedFilterOverview;
  onCardClick: (idx: number) => void;
  isMonitored: boolean;
  isActive?: boolean; // To know if this tab is currently active
}

export const FilterTabContent: React.FC<FilterTabContentProps> = ({
  filter,
  onCardClick,
  isActive = false,
}) => {
  const handleBack = () => {
    // Navigate back to the main dashboard view
    onCardClick(-1); // Special value to indicate going back to dashboard
  };

  return (
    <div className="p-4">
      <DetailedFilterTabContent
        filter={filter}
        enabled={isActive}
        onBack={handleBack}
      />
    </div>
  );
};
