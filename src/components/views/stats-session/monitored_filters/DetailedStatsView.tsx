import { memo, useMemo, useState, useEffect } from 'react';
import { LuSettings } from 'react-icons/lu';
import { OverviewTabData, TabPIDData, NetworkTabData } from '@/types/ui';
import { FilterStatsResponse } from '@/types/domain/gpac/filter-stats';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { InitialTabType } from '@/shared/store/slices/graphSlice';
import { useAppSelector, useOpenLogsWidget } from '@/shared/hooks';
import { useDataMode } from '@/shared/hooks/useDataMode';
import { selectFilterAlerts } from '@/shared/store/selectors/header/headerSelectors';
import { GpacLogLevel } from '@/types/domain/gpac/log-types';
import { StatusBadge } from '@/components/common/StatusBadge';
import FilterChangeBadges from '@/components/common/FilterChangeBadge';
import OverviewTab from './tabs/OverviewTab';
import NetworkTab from './tabs/NetworkTab';
import InputsTab from './tabs/InputsTab';
import OutputsTab from './tabs/OutputsTab';

// Constant fallback
const EMPTY_FILTER_DATA: FilterStatsResponse = {
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
  opids: {},
};

interface DetailedStatsViewProps {
  overviewData: OverviewTabData;
  networkData: NetworkTabData;
  inputPids: TabPIDData[];
  outputPids: TabPIDData[];
  filterData?: FilterStatsResponse;
  onBack: () => void;
  onOpenProperties: () => void;
  initialTab?: InitialTabType;
  isLoading?: boolean;
}

const MemoizedOverviewTab = memo(OverviewTab);
const MemoizedNetworkTab = memo(NetworkTab);
const MemoizedInputsTab = memo(InputsTab);
const MemoizedOutputsTab = memo(OutputsTab);

const DetailedStatsView = memo(
  ({
    overviewData,
    networkData,
    inputPids,
    outputPids,
    filterData = EMPTY_FILTER_DATA, // constant fallback
    onOpenProperties,
    initialTab,
    isLoading = false,
  }: DetailedStatsViewProps) => {
    const [activeTab, setActiveTab] = useState<string>(
      initialTab || 'overview',
    );

    // Get log alerts for this filter
    const alerts = useAppSelector((state) =>
      overviewData.idx !== undefined
        ? selectFilterAlerts(String(overviewData.idx))(state)
        : null,
    );

    // Update active tab when initialTab changes
    useEffect(() => {
      if (initialTab) {
        setActiveTab(initialTab);
      }
    }, [initialTab]);

    const counts = useMemo(
      () => ({
        inputs: inputPids.length,
        outputs: outputPids.length,
      }),
      [inputPids.length, outputPids.length],
    );
    const { isHistory } = useDataMode();
    const openLogsWidget = useOpenLogsWidget();
    const activeTabClass = isHistory
      ? 'h-7 px-3 font-medium data-[state=active]:text-purple-400 data-[state=active]:border-b-2 data-[state=active]:border-purple-400'
      : 'h-7 px-3 font-medium data-[state=active]:text-monitor-active-tab data-[state=active]:border-b-2 data-[state=active]:border-monitor-active-tab';
    const filterKey =
      overviewData.idx !== undefined ? String(overviewData.idx) : null;
    return (
      <div className="flex flex-col gap-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="sticky backdrop-blur-sm top-0 z-10 bg-background/60 pb-2 space-y-2">
            <div className="flex justify-stretch items-center gap-4">
              <h2
                className={`text-lg font-semibold ${isHistory ? 'text-purple-400' : 'text-monitor-active-filter'}`}
              >
                {overviewData.name}
              </h2>

              {/* PID/Arg reconfiguration badges */}
              <FilterChangeBadges filterIdx={overviewData.idx} />

              {/* Log Alerts Badges */}
              <StatusBadge
                label={`${alerts?.errors ?? 0} ERR`}
                colorScheme="red"
                visible={!!alerts && alerts.errors > 0}
                title={`${alerts?.errors ?? 0} error(s) in logs`}
                onClick={() => {
                  if (filterKey) {
                    openLogsWidget({
                      levels: [GpacLogLevel.ERROR],
                      filterKeys: [filterKey],
                    });
                  }
                }}
              />
              <StatusBadge
                label={`${alerts?.warnings ?? 0} WARN`}
                colorScheme="amber"
                visible={!!alerts && alerts.warnings > 0}
                title={`${alerts?.warnings ?? 0} warning(s) in logs`}
                onClick={() => {
                  if (filterKey) {
                    openLogsWidget({
                      levels: [GpacLogLevel.WARNING],
                      filterKeys: [filterKey],
                    });
                  }
                }}
              />

              <Button
                variant="outline"
                size="sm"
                onClick={onOpenProperties}
                className="h-7 px-2 py-0"
                title="Display filter properties"
              >
                <LuSettings className="h-5 w-5" />
              </Button>
            </div>

            <TabsList className="h-8 justify-start  w-full">
              <TabsTrigger value="overview" className={activeTabClass}>
                Overview
              </TabsTrigger>
              <TabsTrigger value="network" className={activeTabClass}>
                Network
              </TabsTrigger>
              <TabsTrigger value="inputs" className={activeTabClass}>
                Inputs ({counts.inputs})
              </TabsTrigger>
              <TabsTrigger value="outputs" className={activeTabClass}>
                Outputs ({counts.outputs})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview">
            <MemoizedOverviewTab filter={overviewData} alerts={alerts} />
          </TabsContent>
          <TabsContent value="network" className="data-[state=inactive]:hidden">
            <MemoizedNetworkTab
              filterId={overviewData.idx.toString()}
              data={networkData}
              filterName={overviewData.name}
              refreshInterval={1000}
            />
          </TabsContent>
          <TabsContent value="inputs">
            <MemoizedInputsTab
              filterData={filterData}
              filterName={overviewData.name}
              isLoading={isLoading}
            />
          </TabsContent>
          <TabsContent value="outputs">
            <MemoizedOutputsTab
              filterData={filterData}
              filterName={overviewData.name}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent re-renders when only frequently-changing data updates

    const filterDataUnchanged =
      prevProps.filterData?.idx === nextProps.filterData?.idx &&
      prevProps.filterData?.status === nextProps.filterData?.status;

    // Overview data contains frequently changing metrics
    const overviewUnchanged =
      prevProps.overviewData.name === nextProps.overviewData.name &&
      prevProps.overviewData.idx === nextProps.overviewData.idx;

    // Network data changes frequently (bytes_sent/received)
    const networkUnchanged =
      prevProps.networkData === nextProps.networkData ||
      (prevProps.networkData.bytesSent === nextProps.networkData.bytesSent &&
        prevProps.networkData.bytesReceived ===
          nextProps.networkData.bytesReceived);

    // Arrays of PIDs - compare lengths (cheap) rather than deep comparison
    const pidsUnchanged =
      prevProps.inputPids.length === nextProps.inputPids.length &&
      prevProps.outputPids.length === nextProps.outputPids.length;

    return (
      filterDataUnchanged &&
      overviewUnchanged &&
      networkUnchanged &&
      pidsUnchanged
    );
  },
);

DetailedStatsView.displayName = 'DetailedStatsView';

export default DetailedStatsView;
