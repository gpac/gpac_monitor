import { LuMonitorCheck, LuSquareArrowUpRight } from 'react-icons/lu';
import type { EnrichedFilterOverview } from '@/types/domain/gpac/model';
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
              <span
                className="ml-1 inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full hover:bg-slate-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onDetachTab(filterIdx, filter.name, e);
                }}
                title="Detach as overlay"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    onDetachTab(filterIdx, filter.name, e as any);
                  }
                }}
              >
                <LuSquareArrowUpRight />
              </span>
            )}
            <span
              className="ml-1 inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded-full hover:bg-slate-600"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(filterIdx, e);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onCloseTab(filterIdx, e as any);
                }
              }}
            >
              ×
            </span>
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
};
