import { useMemo, memo } from 'react';
import { GpacNodeData } from '@/types/domain/gpac/model';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PIDDetails } from '../cards/DetailedStatsCards';

interface InputsTabProps {
  filter: GpacNodeData;
}

const InputsTab = memo(({ filter }: InputsTabProps) => {
  const enhancedInputPids = useMemo(() => {
    if (!filter.ipid) {
      console.log('[InputsTab] No input PIDs available for filter:', filter.name);
      return [];
    }

    const inputPids = Object.entries(filter.ipid).map(([name, data]) => ({
      name,
      ...data,
      parentFilter: {
        name: filter.name,
        codec: filter.codec,
        status: filter.status,
        pck_done: filter.pck_done,
        bytes_done: filter.bytes_done,
        pck_sent: filter.pck_sent,
        time: filter.time,
      },
    }));



    return inputPids;
  }, [filter]);

  return (
    <ScrollArea className="h-[400px]">
      {enhancedInputPids.length > 0 ? (
        <div className="space-y-4">
          {enhancedInputPids.map((pid) => (
            <PIDDetails
              key={pid.name}
              {...pid}
              codec={pid.codec || pid.parentFilter.codec}
            />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          No input PIDs available
        </div>
      )}
    </ScrollArea>
  );
});

InputsTab.displayName = 'InputsTab';

export default InputsTab;