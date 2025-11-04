import { LuMonitorCheck, LuSquareArrowUpRight } from 'react-icons/lu';
import type { EnrichedFilterOverview } from '@/types/domain/gpac/model';
import { Button } from '@/components/ui/button';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import React from 'react';
import { useAppSelector } from '@/shared/hooks/redux';

interface StatsTabsProps {
  activeTab: string;
  onValueChange: (value: string) => void;
  allFilters: EnrichedFilterOverview[]; // All available filters
  onCloseTab: (idx: number, e: React.MouseEvent) => void;
  onDetachTab?: (idx: number, filterName: string, e: React.MouseEvent) => void;
  tabsRef: React.RefObject<HTMLDivElement>;
}

export const StatsTabs: React.FC<StatsTabsProps> = ({
  onValueChange,
  allFilters,
  onCloseTab,
  onDetachTab,
  tabsRef,
}) => {
  // Read viewByFilter from Redux (single source of truth)
  const viewByFilter = useAppSelector((state) => state.widgets.viewByFilter);

  // Derive inline filters from viewByFilter
  const inlineFilters = Object.entries(viewByFilter)
    .filter(([_, view]) => view?.mode === 'inline')
    .map(([idx]) => Number(idx));

  return (
    <TabsList
      className="sticky top-0 z-50 mb-4 justify-start border-b  border-border bg-black/40 backdrop-blur-sm "
      ref={tabsRef}
    >
      <TabsTrigger
        value="main"
        className="flex items-center gap-1"
        data-value="main"
        onClick={() => onValueChange('main')}
      >
        <LuMonitorCheck className="h-4 w-4" />
        <span>Dashboard</span>
      </TabsTrigger>

      {/* Tabs for inline filters (derived from viewByFilter) */}
      {inlineFilters.map((filterIdx) => {
        const filter = allFilters.find((f) => f.idx === filterIdx);
        if (!filter) return null;

        return (
          <TabsTrigger
            key={`tab-${filterIdx}`}
            value={`filter-${filterIdx}`}
            className="flex items-center gap-1"
            data-value={`filter-${filterIdx}`}
            onClick={() => onValueChange(`filter-${filterIdx}`)}
          >
            <span>{filter.name}</span>
            {onDetachTab && (
              <Button
                variant="ghost"
                className="ml-1 h-5 w-5 rounded-full p-0 hover:bg-slate-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onDetachTab(filterIdx, filter.name, e);
                }}
                title="Detach as overlay"
              >
                <LuSquareArrowUpRight />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="ml-1 h-4 w-4 rounded-full p-0"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(filterIdx, e);
              }}
            >
              ×
            </Button>
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
};
