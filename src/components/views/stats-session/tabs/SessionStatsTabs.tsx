import type { GpacNodeData } from '@/types/domain/gpac/model';

import { Button } from '@/components/ui/button';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import React from 'react';
import { LuMonitorCheck } from 'react-icons/lu';

interface StatsTabsProps {
  activeTab: string;
  onValueChange: (value: string) => void;
  monitoredFilters: Map<number, GpacNodeData>;
  onCloseTab: (idx: number, e: React.MouseEvent) => void;
  tabsRef: React.RefObject<HTMLDivElement>;
}

export const StatsTabs: React.FC<StatsTabsProps> = ({
  onValueChange,
  monitoredFilters,
  onCloseTab,
  tabsRef,
}) => {
  return (
    <TabsList
      className="sticky top-0 z-10 mb-4 justify-start border-b border-border bg-black/30 backdrop-blur-sm"
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
      {Array.from(monitoredFilters.entries()).map(([idx, filter]) => (
        <TabsTrigger
          key={`tab-${idx}`}
          value={`filter-${idx}`}
          className="flex items-center gap-1"
          data-value={`filter-${idx}`}
          onClick={() => onValueChange(`filter-${idx}`)}
        >
          <span>{filter.name}</span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-1 h-4 w-4 rounded-full p-0"
            onClick={(e) => onCloseTab(idx, e)}
          >
            ×
          </Button>
        </TabsTrigger>
      ))}
    </TabsList>
  );
};
