import { useMemo, memo } from 'react';
import { GpacNodeData } from '@/types/domain/gpac/model';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PIDDetails } from '../cards/DetailedStatsCards';

interface OutputsTabProps {
  filter: GpacNodeData;
}

const OutputsTab = memo(({ filter }: OutputsTabProps) => {
  const enhancedOutputPids = useMemo(() => {
    if (!filter.opid) {
      console.log('[OutputsTab] No output PIDs available for filter:', filter.name);
      return [];
    }

    const outputPids = Object.entries(filter.opid).map(([name, data]) => ({
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

    console.log('[OutputsTab] Output PIDs stats for filter', filter.name, ':', {
      totalOutputPids: outputPids.length,
      pidNames: outputPids.map(pid => pid.name),
      pidDetails: outputPids,
      rawOpidData: filter.opid
    });

    return outputPids;
  }, [filter]);

  return (
    <ScrollArea className="h-[400px]">
      {enhancedOutputPids.length > 0 ? (
        <div className="space-y-4">
          {enhancedOutputPids.map((pid) => (
            <PIDDetails
              key={pid.name}
              {...pid}
              codec={pid.codec || pid.parentFilter.codec}
            />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          No output PIDs available
        </div>
      )}
    </ScrollArea>
  );
});

OutputsTab.displayName = 'OutputsTab';

export default OutputsTab;