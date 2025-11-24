import { memo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { useSidebar } from '@/shared/hooks/useSidebar';
import type { InputsTabProps, PIDWithIndex } from '../../types';
import { useInputsTabData } from './hooks/useInputsTabData';
import PIDMetricsCard from './PIDMetricsCard';
import PIDTable from './PIDTable';

const InputsTab = memo(
  ({ filterData, filterName, isLoading = false }: InputsTabProps) => {
    const { openPIDProps } = useSidebar();
    const { inputPidsWithIndices, groupedInputs, inputNames, globalStatus } =
      useInputsTabData(filterData);

    // Stable callback for opening PID properties
    const handleOpenProps = useCallback(
      (filterIdx: number, ipidIdx: number) => {
        openPIDProps({ filterIdx, ipidIdx });
      },
      [openPIDProps],
    );

    // Flatten all PIDs for grid display
    const allPidsWithType = inputNames.flatMap((inputName) =>
      Object.entries(groupedInputs[inputName]).flatMap(([type, pids]) =>
        pids.map((pid: PIDWithIndex) => ({ pid, type })),
      ),
    );

    return (
      <div className="space-y-3">
        {/* Global Status Bar */}
        {inputPidsWithIndices.length > 0 && (
          <div className="bg-background/30 rounded-lg px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium">Status</span>
                <span className="text-xs text-info tabular-nums">
                  {globalStatus.totalPids} stream
                  {globalStatus.totalPids > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {globalStatus.errors > 0 && (
                  <Badge
                    variant="destructive"
                    className="text-[10px] px-1.5 py-0 h-5 tabular-nums"
                  >
                    {globalStatus.errors} Error
                  </Badge>
                )}
                {globalStatus.active > 0 && (
                  <Badge
                    variant="default"
                    className="text-[10px] px-1.5 py-0 h-5 tabular-nums"
                  >
                    {globalStatus.active} Active
                  </Badge>
                )}
                {globalStatus.eos > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-5 tabular-nums"
                  >
                    {globalStatus.eos} EOS
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
        {/* PIDs Display - Table mode for >3, Grid mode for ≤3 */}
        {allPidsWithType.length > 0 ? (
          allPidsWithType.length > 3 ? (
            <PIDTable
              pids={inputPidsWithIndices}
              filterIdx={filterData.idx}
              onOpenProps={handleOpenProps}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {allPidsWithType.map(({ pid, type }) => (
                <PIDMetricsCard
                  key={`${pid.name}-${pid.ipidIdx}`}
                  pid={pid}
                  type={type}
                  filterIdx={filterData.idx}
                  onOpenProps={handleOpenProps}
                />
              ))}
            </div>
          )
        ) : isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground text-sm">
            No input PIDs available for {filterName}
          </div>
        )}
      </div>
    );
  },
);

InputsTab.displayName = 'InputsTab';

export default InputsTab;
