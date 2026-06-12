import { memo, useMemo, useState, useEffect } from 'react';
import { OverviewTabData, TabPIDData, NetworkTabData } from '@/types/ui';
import { FilterStatsResponse } from '@/types/domain/gpac/filter-stats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { InitialTabType } from '@/shared/store/slices/graphSlice';
import { useAppSelector, useOpenLogsWidget } from '@/shared/hooks';
import { useDataMode } from '@/shared/hooks/data/useDataMode';
import { selectFilterAlerts } from '@/shared/store/selectors/header/headerSelectors';
import { GpacLogLevel } from '@/types/domain/gpac/log-types';
import { StatusBadge } from '@/components/common/StatusBadge';
import FilterChangeBadges from '@/components/common/FilterChangeBadge';
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
  onTabChange?: (tab: string) => void;
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
    onTabChange,
    isLoading = false,
    isDetached = false,
  }: MonitoredFilterViewProps) => {
    const [activeTab, setActiveTab] = useState<string>(
      initialTab || 'overview',
    );

    const handleTabChange = (tab: string) => {
      setActiveTab(tab);
      onTabChange?.(tab);
    };

    // Get log alerts for this filter
    const alerts = useAppSelector((state) =>
      overviewData.filterIdx !== undefined
        ? selectFilterAlerts(String(overviewData.filterIdx))(state)
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
      overviewData.filterIdx !== undefined
        ? String(overviewData.filterIdx)
        : null;
    return (
      <FilterViewProvider value={isDetached}>
        <div className="flex flex-col gap-2">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <div
              className={`sticky ${isDetached ? 'top-0' : 'top-10'} z-10 bg-monitor-surface space-y-1 px-1 py-2`}
            >
              <div className="flex justify-stretch items-center gap-4">
                <FilterChangeBadges filterIdx={overviewData.filterIdx} />
                <StatusBadge
                  label={`${alerts?.errors ?? 0} ERR`}
                  colorScheme="red"
                  visible={Boolean(alerts && alerts.errors > 0)}
                  title={`${alerts?.errors ?? 0} error(s) in logs`}
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
                  label={`${alerts?.warnings ?? 0} WARN`}
                  colorScheme="amber"
                  visible={Boolean(alerts && alerts.warnings > 0)}
                  title={`${alerts?.warnings ?? 0} warning(s) in logs`}
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

              <TabsList className="h-8 justify-start w-full">
                <TabsTrigger value="overview" className={activeTabClass}>
                  Overview
                </TabsTrigger>
                <TabsTrigger value="network" className={activeTabClass}>
                  Stats
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
                filterId={overviewData.filterIdx.toString()}
                data={networkData}
                filterName={overviewData.name}
                lastTaskTimeUs={overviewData.last_task_time}
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
      prevProps.overviewData.filterIdx === nextProps.overviewData.filterIdx;

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
