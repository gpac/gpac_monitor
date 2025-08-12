import { memo } from 'react';
import { FilterStatsResponse } from '@/types/domain/gpac/filter-stats';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PIDStatsOverview } from '../cards/PIDStatsOverview';

interface OutputsTabProps {
  filterData: FilterStatsResponse;
  filterName: string;
}

const OutputsTab = memo(({ filterData, filterName }: OutputsTabProps) => {
  const outputPids = filterData.opids ? Object.values(filterData.opids) : [];

  return (
    <ScrollArea className="h-[400px]">
      {outputPids.length > 0 ? (
        <div className="space-y-6">
          {outputPids.map((pid) => (
            <div key={pid.name} className="space-y-4">
              <PIDStatsOverview pidData={pid} showAdvanced={true} />
            </div>
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
