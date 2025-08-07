import { memo, useMemo } from 'react';
import { OverviewTabData } from '@/types/domain/gpac/filter-stats';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  PIDMetricsCard,
  ProcessingCard,
  PacketsCard,
  DataCard,
} from '../cards/DetailedStatsCards';

interface OverviewTabProps {
  filter: OverviewTabData;
}

const OverviewTab = memo(({ filter }: OverviewTabProps) => {
  // Data extraction for cards
  const cardData = useMemo(
    () => ({
      tasks: filter.tasks,
      time: filter.time,
      pck_done: filter.pck_done,
      pck_sent: filter.pck_sent,
      pck_ifce_sent: filter.pck_ifce_sent,
      bytes_done: filter.bytes_done,
      bytes_sent: filter.bytes_sent,
    }),
    [
      filter.tasks,
      filter.time,
      filter.pck_done,
      filter.pck_sent,
      filter.pck_ifce_sent,
      filter.bytes_done,
      filter.bytes_sent,
    ],
  );



  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4">
        {/* PID Metrics */}
        <PIDMetricsCard data={{ nb_ipid: filter.nb_ipid, nb_opid: filter.nb_opid } as any} />

        <div className="grid grid-cols-1 bg-stat border-0 gap-4 sm:grid-cols-3 ">
          {/* Processing Card */}
          <ProcessingCard tasks={cardData.tasks} time={cardData.time} />

          {/* Packets Card */}
          <PacketsCard
            pck_done={cardData.pck_done}
            pck_sent={cardData.pck_sent}
            pck_ifce_sent={cardData.pck_ifce_sent}
          />

          {/* Data Card */}
          <DataCard
            bytes_done={cardData.bytes_done}
            bytes_sent={cardData.bytes_sent}
          />
        </div>
      </div>
    </ScrollArea>
  );
});

OverviewTab.displayName = 'OverviewTab';

export default OverviewTab;