import { memo, useMemo } from 'react';
import { LuSettings } from 'react-icons/lu';
import {
  OverviewTabData,
  BuffersTabData,
  TabPIDData,
  NetworkTabData,
  FilterStatsResponse,
} from '@/types/domain/gpac/filter-stats';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OverviewTab from './tabs/OverviewTab';
import NetworkTab from './tabs/NetworkTab';
import BuffersTab from './tabs/BuffersTab';
import InputsTab from './tabs/InputsTab';
import OutputsTab from './tabs/OutputsTab';

interface DetailedStatsViewProps {
  overviewData: OverviewTabData;
  networkData: NetworkTabData;
  buffersData: BuffersTabData;
  inputPids: TabPIDData[];
  outputPids: TabPIDData[];
  filterData?: FilterStatsResponse;
  onBack: () => void;
  onOpenProperties: () => void;
}

const MemoizedOverviewTab = memo(OverviewTab);
const MemoizedNetworkTab = memo(NetworkTab);
const MemoizedBuffersTab = memo(BuffersTab);
const MemoizedInputsTab = memo(InputsTab);
const MemoizedOutputsTab = memo(OutputsTab);

const DetailedStatsView = memo(
  ({
    overviewData,
    networkData,
    buffersData,
    inputPids,
    outputPids,
    filterData,
    onOpenProperties,
  }: DetailedStatsViewProps) => {
    const badgeVariant = useMemo(
      () =>
        overviewData.status?.includes('error') ? 'destructive' : 'secondary',
      [overviewData.status],
    );

    const counts = useMemo(
      () => ({
        inputs: inputPids.length,
        outputs: outputPids.length,
      }),
      [inputPids.length, outputPids.length],
    );

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenProperties}
            className="h-7 px-2 py-0"
            title="Display filter properties"
          >
            <LuSettings className="h-3.5 w-3.5" />
          </Button>
          <h2 className="text-lg font-semibold">{overviewData.name}</h2>
          <Badge variant={badgeVariant}>
            {overviewData.status || 'Unknown status'}
          </Badge>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="sticky top-0 z-10 mb-4 h-8 justify-start border-b bg-background">
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

          <TabsContent
            value="overview"
            forceMount
            className="data-[state=inactive]:hidden"
          >
            <MemoizedOverviewTab filter={overviewData} />
          </TabsContent>
          <TabsContent
            value="network"
            forceMount
            className="data-[state=inactive]:hidden"
          >
            <MemoizedNetworkTab
              data={networkData}
              filterName={overviewData.name}
              refreshInterval={5000}
            />
          </TabsContent>
          <TabsContent
            value="buffers"
            forceMount
            className="data-[state=inactive]:hidden"
          >
            <MemoizedBuffersTab data={buffersData} />
          </TabsContent>
          <TabsContent
            value="inputs"
            forceMount
            className="data-[state=inactive]:hidden"
          >
            <MemoizedInputsTab
              filterData={
                filterData || {
                  idx: 0,
                  status: '',
                  bytes_done: 0,
                  bytes_sent: 0,
                  pck_done: 0,
                  pck_sent: 0,
                  time: 0,
                  nb_ipid: 0,
                  nb_opid: 0,
                  ipids: {},
                }
              }
              filterName={overviewData.name}
            />
          </TabsContent>
          <TabsContent
            value="outputs"
            forceMount
            className="data-[state=inactive]:hidden"
          >
            <MemoizedOutputsTab
              filterData={
                filterData || {
                  idx: 0,
                  status: '',
                  bytes_done: 0,
                  bytes_sent: 0,
                  pck_done: 0,
                  pck_sent: 0,
                  time: 0,
                  nb_ipid: 0,
                  nb_opid: 0,
                  opids: {},
                }
              }
              filterName={overviewData.name}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  },
);

DetailedStatsView.displayName = 'DetailedStatsView';

export default DetailedStatsView;
