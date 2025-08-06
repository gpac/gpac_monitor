import { memo } from 'react';
import { TabPIDData } from '@/types/domain/gpac/filter-stats';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PIDDetails } from '../cards/DetailedStatsCards';

interface InputsTabProps {
  inputPids: TabPIDData[];
  filterName: string;
}

const InputsTab = memo(({ inputPids, filterName }: InputsTabProps) => {
  console.log('[InputsTab] Input PIDs stats for filter', filterName, ':', {
    totalInputPids: inputPids.length,
    pidNames: inputPids.map(pid => pid.name),
    pidDetails: inputPids
  });

  return (
    <ScrollArea className="h-[400px]">
      {inputPids.length > 0 ? (
        <div className="space-y-4">
          {inputPids.map((pid) => (
            <PIDDetails
              key={pid.name}
              {...pid}
              codec={pid.codec || pid.parentFilter.codec}
            />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          No input PIDs available for {filterName}
        </div>
      )}
    </ScrollArea>
  );
});

InputsTab.displayName = 'InputsTab';

export default InputsTab;