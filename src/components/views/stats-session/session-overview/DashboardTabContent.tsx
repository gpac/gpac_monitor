import type { EnrichedFilterOverview } from "@/types/domain/gpac/model"

import React from "react"
import { FiltersGrid } from "./FiltersGrid"



interface SystemStats {
  activeFilters: number
  totalBytes: number
  totalPackets: number
}

interface DashboardTabContentProps {
  systemStats: SystemStats
  filtersWithLiveStats: EnrichedFilterOverview[]
  filtersMatchingCriteria: EnrichedFilterOverview[]
  loading: boolean
  monitoredFilters: Map<number, EnrichedFilterOverview>
  onCardClick: (idx: number) => void
  refreshInterval: string
}

export const DashboardTabContent: React.FC<DashboardTabContentProps> = ({
  filtersWithLiveStats,
  filtersMatchingCriteria,
  loading,
  monitoredFilters,
  onCardClick,
}) => {
  console.log('🔍 [DashboardTabContent] filtersWithLiveStats:', filtersWithLiveStats);
  console.log('🔍 [DashboardTabContent] filtersMatchingCriteria:', filtersMatchingCriteria);
  
  return (
    <div className="space-y-4">
      <FiltersGrid
        filtersWithLiveStats={filtersWithLiveStats}
        filtersMatchingCriteria={filtersMatchingCriteria}
        loading={loading}
        monitoredFilters={monitoredFilters}
        onCardClick={onCardClick}

      />
    </div>
  )
}