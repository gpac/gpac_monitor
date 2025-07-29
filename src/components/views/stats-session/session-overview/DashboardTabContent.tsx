import type { GpacNodeData } from "@/types/domain/gpac/model"

import React from "react"
import { FiltersGrid } from "./FiltersGrid"



interface SystemStats {
  activeFilters: number
  totalBytes: number
  totalPackets: number
}

interface DashboardTabContentProps {

  systemStats: SystemStats
  filtersWithLiveStats: GpacNodeData[]
  filtersMatchingCriteria: GpacNodeData[]
  rawFiltersFromServer: GpacNodeData[]
  loading: boolean
  monitoredFilters: Map<number, GpacNodeData>
  onCardClick: (idx: number) => void
  onRefreshFilters: () => void
  refreshInterval: string
}

export const DashboardTabContent: React.FC<DashboardTabContentProps> = ({
  filtersWithLiveStats,
  filtersMatchingCriteria,
  rawFiltersFromServer,
  loading,
  monitoredFilters,
  onCardClick,
  onRefreshFilters
}) => {
  return (
    <div className="space-y-4">
      <FiltersGrid
        filtersWithLiveStats={filtersWithLiveStats}
        filtersMatchingCriteria={filtersMatchingCriteria}
        rawFiltersFromServer={rawFiltersFromServer}
        loading={loading}
        monitoredFilters={monitoredFilters}
        onCardClick={onCardClick}
        onRefreshFilters={onRefreshFilters}
      />
    </div>
  )
}