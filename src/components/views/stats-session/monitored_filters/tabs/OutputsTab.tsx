import { memo } from 'react';
import { TabPIDData } from '@/types/domain/gpac/filter-stats';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PIDDetails } from '../cards/DetailedStatsCards';

interface OutputsTabProps {
  outputPids: TabPIDData[];
  filterName: string;
}

const OutputsTab = memo(({ outputPids, filterName }: OutputsTabProps) => {
  console.log('[OutputsTab] Output PIDs stats for filter', filterName, ':', {
    totalOutputPids: outputPids.length,
    pidNames: outputPids.map(pid => pid.name),
    pidDetails: outputPids
  });

  return (
    <ScrollArea className="h-[400px]">
      {outputPids.length > 0 ? (
        <div className="space-y-4">
          {outputPids.map((pid) => (
            <PIDDetails
              key={pid.name}
              {...pid}
              codec={pid.codec || pid.parentFilter.codec}
            />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          No output PIDs available for {filterName}
        </div>
      )}
    </ScrollArea>
  );
});

OutputsTab.displayName = 'OutputsTab';

export default OutputsTab;