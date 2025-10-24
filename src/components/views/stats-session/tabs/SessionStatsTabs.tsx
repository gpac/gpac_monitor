import { LuMonitorCheck, LuSquareArrowUpRight, LuBan } from 'react-icons/lu';
import type { GpacNodeData } from '@/types/domain/gpac/model';
import { Button } from '@/components/ui/button';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Widget, WidgetType } from '@/types/ui/widget';
import React from 'react';

interface StatsTabsProps {
  activeTab: string;
  onValueChange: (value: string) => void;
  monitoredFilters: Map<number, GpacNodeData>;
  onCloseTab: (idx: number, e: React.MouseEvent) => void;
  onDetachTab?: (idx: number, filterName: string, e: React.MouseEvent) => void;
  tabsRef: React.RefObject<HTMLDivElement>;
  activeWidgets?: Widget[];
}

export const StatsTabs: React.FC<StatsTabsProps> = ({
  onValueChange,
  monitoredFilters,
  onCloseTab,
  onDetachTab,
  tabsRef,
  activeWidgets = [],
}) => {
  // Check if a filter has a detached widget
  const isFilterDetached = (filterIdx: number): boolean => {
    return activeWidgets.some(
      (w) =>
        w.type === WidgetType.FILTERSESSION &&
        w.isDetached === true &&
        w.detachedFilterIdx === filterIdx,
    );
  };

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

      {/* Tabs for monitored filters */}
      {Array.from(monitoredFilters.entries()).map(([idx, filter]) => {
        const isDetached = isFilterDetached(idx);

        return (
          <TabsTrigger
            key={`tab-${idx}`}
            value={`filter-${idx}`}
            className="flex items-center gap-1"
            data-value={`filter-${idx}`}
            onClick={() => onValueChange(`filter-${idx}`)}
          >
            <span>{filter.name}</span>
            {onDetachTab && (
              <Button
                variant="ghost"
                className={`ml-1 h-4 w-4 rounded-full p-0 ${
                  isDetached
                    ? 'cursor-not-allowed opacity-50'
                    : 'hover:bg-slate-600'
                }`}
                onClick={(e) => {
                  if (!isDetached) {
                    onDetachTab(idx, filter.name, e);
                  } else {
                    e.stopPropagation();
                  }
                }}
                disabled={isDetached}
                title={
                  isDetached
                    ? 'Filter already open in detached view'
                    : 'Detach as overlay'
                }
              >
                {isDetached ? (
                  <LuBan className="text-red-400" />
                ) : (
                  <LuSquareArrowUpRight />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="ml-1 h-4 w-4 rounded-full p-0"
              onClick={(e) => onCloseTab(idx, e)}
            >
              ×
            </Button>
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
};
