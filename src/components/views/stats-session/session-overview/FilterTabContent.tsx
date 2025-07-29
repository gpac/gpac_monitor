import type { GpacNodeData } from "@/types/domain/gpac/model"

import React from "react"
import FilterStatCard from "../FilterStatCard"

interface FilterTabContentProps {
  filter: GpacNodeData
  onCardClick: (idx: number) => void
  isMonitored: boolean
}

export const FilterTabContent: React.FC<FilterTabContentProps> = ({ 
  filter, 
  onCardClick, 
  isMonitored 
}) => {
  return (
    <div className="p-4">
      <div className="max-w-md mx-auto">
        <FilterStatCard
          filter={filter}
          onClick={onCardClick}
          isMonitored={isMonitored}
        />
      </div>
    </div>
  )
}