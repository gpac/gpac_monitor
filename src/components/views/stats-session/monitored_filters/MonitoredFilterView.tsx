import { memo, useMemo, useState, useEffect } from 'react';
import { OverviewTabData, TabPIDData, NetworkTabData } from '@/types/ui';
import { FilterStatsResponse } from '@/types/domain/gpac/filter-stats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { InitialTabType } from '@/shared/store/slices/graphSlice';
import { useAppSelector, useOpenLogsWidget } from '@/shared/hooks';
import { selectFilterAlerts } from '@/shared/store/selectors/header/headerSelectors';
import { GpacLogLevel } from '@/types/domain/gpac/log-types';
import FilterChangeBadges from '@/components/common/FilterChangeBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { FilterViewProvider } from './FilterViewContext';
import OverviewTab from './tabs/OverviewTab';
import NetworkTab from './tabs/NetworkTab';
import InputsTab from './tabs/pid/InputsTab';
import OutputsTab from './tabs/pid/OutputsTab';

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

interface MonitoredFilterViewProps {
  overviewData: OverviewTabData;
  networkData: NetworkTabData;
  inputPids: TabPIDData[];
  outputPids: TabPIDData[];
  filterData?: FilterStatsResponse;
  onBack: () => void;
  onOpenProperties: () => void;
  initialTab?: InitialTabType;
  isLoading?: boolean;
  isDetached?: boolean;
}

const MemoizedOverviewTab = memo(OverviewTab);
const MemoizedNetworkTab = memo(NetworkTab);
const MemoizedInputsTab = memo(InputsTab);
const MemoizedOutputsTab = memo(OutputsTab);

const MonitoredFilterView = memo(
  ({
    overviewData,
    networkData,
    inputPids,
    outputPids,
    filterData = EMPTY_FILTER_DATA,
    onOpenProperties,
    initialTab,
    isLoading = false,
    isDetached = false,
  }: MonitoredFilterViewProps) => {
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
    const openLogsWidget = useOpenLogsWidget();
    const filterKey =
      overviewData.idx !== undefined ? String(overviewData.idx) : null;
    return (
      <FilterViewProvider value={isDetached}>
        <div className="flex flex-col gap-2">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="sticky backdrop-blur-sm top-0 z-10 bg-background/60 space-y-1 px-1 py-2">
              <div className="flex justify-stretch items-center gap-4">
                <FilterChangeBadges filterIdx={overviewData.idx} />
                <StatusBadge
                  label={`${alerts?.errors} ERR`}
                  colorScheme="red"
                  visible={Boolean(alerts && alerts.errors > 0)}
                  title={`${alerts?.errors} error(s) in logs`}
                  onClick={
                    filterKey
                      ? () =>
                          openLogsWidget({
                            levels: [GpacLogLevel.ERROR],
                            filterKeys: [filterKey],
                          })
                      : undefined
                  }
                />
                <StatusBadge
                  label={`${alerts?.warnings} WARN`}
                  colorScheme="amber"
                  visible={Boolean(alerts && alerts.warnings > 0)}
                  title={`${alerts?.warnings} warning(s) in logs`}
                  onClick={
                    filterKey
                      ? () =>
                          openLogsWidget({
                            levels: [GpacLogLevel.WARNING],
                            filterKeys: [filterKey],
                          })
                      : undefined
                  }
                />
              </div>

              <TabsList className="h-8 justify-start  w-full">
                <TabsTrigger
                  value="overview"
                  className="h-7 px-3 font-medium data-[state=active]:text-monitor-active-tab data-[state=active]:border-b-2 data-[state=active]:border-monitor-active-tab"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="network"
                  className="h-7 px-3 font-medium data-[state=active]:text-monitor-active-tab data-[state=active]:border-b-2 data-[state=active]:border-monitor-active-tab"
                >
                  Stats
                </TabsTrigger>
                <TabsTrigger
                  value="inputs"
                  className="h-7 px-3 font-medium data-[state=active]:text-monitor-active-tab data-[state=active]:border-b-2 data-[state=active]:border-monitor-active-tab"
                >
                  Inputs ({counts.inputs})
                </TabsTrigger>
                <TabsTrigger
                  value="outputs"
                  className="h-7 px-3 font-medium data-[state=active]:text-monitor-active-tab data-[state=active]:border-b-2 data-[state=active]:border-monitor-active-tab"
                >
                  Outputs ({counts.outputs})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview">
              <MemoizedOverviewTab
                filter={overviewData}
                alerts={alerts}
                onOpenProperties={onOpenProperties}
              />
            </TabsContent>
            <TabsContent
              value="network"
              className="data-[state=inactive]:hidden"
            >
              <MemoizedNetworkTab
                filterId={overviewData.idx.toString()}
                data={networkData}
                filterName={overviewData.name}
                refreshInterval={1000}
                filterTimeUs={overviewData.time}
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
      </FilterViewProvider>
    );
  },
  (prevProps, nextProps) => {
    const filterDataUnchanged =
      prevProps.filterData?.idx === nextProps.filterData?.idx &&
      prevProps.filterData?.status === nextProps.filterData?.status &&
      prevProps.filterData?.time === nextProps.filterData?.time;

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

MonitoredFilterView.displayName = 'MonitoredFilterView';

export default MonitoredFilterView;
