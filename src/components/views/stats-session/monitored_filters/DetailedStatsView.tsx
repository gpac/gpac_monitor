import { memo, useMemo } from 'react';
import { LuChevronLeft } from 'react-icons/lu';
import { GpacNodeData } from '@/types/domain/gpac/model';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OverviewTab from './tabs/OverviewTab';
import NetworkTab from './tabs/NetworkTab';
import BuffersTab from './tabs/BuffersTab';
import InputsTab from './tabs/InputsTab';
import OutputsTab from './tabs/OutputsTab';

interface DetailedStatsViewProps {
  filter: GpacNodeData;
  onBack: () => void;
}

const MemoizedOverviewTab = memo(OverviewTab);
const MemoizedNetworkTab = memo(NetworkTab);
const MemoizedBuffersTab = memo(BuffersTab);
const MemoizedInputsTab = memo(InputsTab);
const MemoizedOutputsTab = memo(OutputsTab);

const DetailedStatsView = memo(
  ({ filter, onBack }: DetailedStatsViewProps) => {
    const badgeVariant = useMemo(
      () => (filter.status?.includes('error') ? 'destructive' : 'secondary'),
      [filter.status],
    );

    const counts = useMemo(
      () => ({
        inputs: filter.nb_ipid || 0,
        outputs: filter.nb_opid || 0,
      }),
      [filter.nb_ipid, filter.nb_opid],
    );

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="h-7 px-2 py-0"
          >
            <LuChevronLeft className="h-3.5 w-3.5" />
            Back
          </Button>
          <h2 className="text-lg font-semibold">{filter.name}</h2>
          <Badge variant={badgeVariant}>
            {filter.status || 'Unknown status'}
          </Badge>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="sticky top-0 z-10 mb-2 h-8 justify-start border-b bg-background">
            <TabsTrigger
              value="overview"
              className="h-7 px-3 font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="network"
              className="h-7 px-3 font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Network
            </TabsTrigger>
            <TabsTrigger
              value="buffers"
              className="h-7 px-3 font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Buffers
            </TabsTrigger>
            <TabsTrigger
              value="inputs"
              className="h-7 px-3 font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Inputs ({counts.inputs})
            </TabsTrigger>
            <TabsTrigger
              value="outputs"
              className="h-7 px-3 font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Outputs ({counts.outputs})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <MemoizedOverviewTab filter={filter} />
          </TabsContent>
          <TabsContent value="network">
            <MemoizedNetworkTab filter={filter} refreshInterval={5000} />
          </TabsContent>
          <TabsContent value="buffers">
            <MemoizedBuffersTab filter={filter} />
          </TabsContent>
          <TabsContent value="inputs">
            <MemoizedInputsTab filter={filter} />
          </TabsContent>
          <TabsContent value="outputs">
            <MemoizedOutputsTab filter={filter} />
          </TabsContent>
        </Tabs>
      </div>
    );
  },
);

DetailedStatsView.displayName = 'DetailedStatsView';

export default DetailedStatsView;