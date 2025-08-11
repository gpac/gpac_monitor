import { memo } from 'react';
import { FilterStatsResponse } from '@/types/domain/gpac/filter-stats';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PIDStatsOverview } from '../cards/PIDStatsOverview';

interface InputsTabProps {
  filterData: FilterStatsResponse;
  filterName: string;
}

const InputsTab = memo(({ filterData, filterName }: InputsTabProps) => {
  const inputPids = filterData.ipids ? Object.values(filterData.ipids) : [];
  
  console.log('[InputsTab] Input PIDs stats for filter', filterName, ':', {
    totalInputPids: inputPids.length,
    pidNames: inputPids.map(pid => pid.name),
    pidDetails: inputPids
  });

  return (
    <ScrollArea className="h-[400px]">
      {inputPids.length > 0 ? (
        <div className="space-y-6">
          {inputPids.map((pid) => (
            <div key={pid.name} className="space-y-4">
              <PIDStatsOverview
                pidData={pid}
                showAdvanced={true}
              />
   
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-muted-foreground stat-label">
          No input PIDs available for {filterName}
        </div>
      )}
    </ScrollArea>
  );
});

InputsTab.displayName = 'InputsTab';

export default InputsTab;