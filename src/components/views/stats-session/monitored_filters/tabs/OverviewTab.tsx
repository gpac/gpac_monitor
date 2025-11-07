import { memo } from 'react';
import { OverviewTabData } from '@/types/domain/gpac/filter-stats';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  PIDMetricsCard,
  ProcessingCard,
  PacketsCard,
  DataCard,
  FilterHealthCard,
  RealtimeMetricsCard,
} from '../cards';

interface OverviewTabProps {
  filter: OverviewTabData;
}

const OverviewTab = memo(({ filter }: OverviewTabProps) => {
  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4">
        {/* Filter Health */}
        <FilterHealthCard filter={filter} />

        {/* Real-time Metrics - NEW */}
        <RealtimeMetricsCard filter={filter} />

        {/* PID Metrics */}
        <PIDMetricsCard
          filter={{
            idx: filter.idx,
            status: filter.status,
            bytes_done: filter.bytes_done,
            bytes_sent: filter.bytes_sent,
            pck_done: filter.pck_done,
            pck_sent: filter.pck_sent,
            time: filter.time,
            nb_ipid: filter.nb_ipid,
            nb_opid: filter.nb_opid,
          }}
        />

        <div className="grid grid-cols-1 bg-stat border-0 gap-4 sm:grid-cols-3 ">
          {/* Processing Card */}
          <ProcessingCard tasks={filter.tasks} time={filter.time} />

          {/* Packets Card */}
          <PacketsCard
            pck_done={filter.pck_done}
            pck_sent={filter.pck_sent}
            pck_ifce_sent={filter.pck_ifce_sent}
          />

          {/* Data Card */}
          <DataCard
            bytes_done={filter.bytes_done}
            bytes_sent={filter.bytes_sent}
          />
        </div>
      </div>
    </ScrollArea>
  );
});

OverviewTab.displayName = 'OverviewTab';

export default OverviewTab;
