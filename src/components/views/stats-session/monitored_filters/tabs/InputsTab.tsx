import { memo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { useSidebar } from '@/shared/hooks/useSidebar';
import type { InputsTabProps, PIDWithIndex } from '../../types';
import { useInputsTabData } from './hooks/useInputsTabData';
import PIDTable from './PIDTable';
import { TAB_STYLES } from './styles';

const InputsTab = memo(
  ({ filterData, filterName, isLoading = false }: InputsTabProps) => {
    const { openPIDProps } = useSidebar();
    const { inputPidsWithIndices, groupedInputs, inputNames, globalStatus } =
      useInputsTabData(filterData);

    const handleOpenProps = useCallback(
      (filterIdx: number, ipidIdx: number) => {
        openPIDProps({ filterIdx, ipidIdx });
      },
      [openPIDProps],
    );

    const allPidsWithType = inputNames.flatMap((inputName) =>
      Object.entries(groupedInputs[inputName]).flatMap(([type, pids]) =>
        pids.map((pid: PIDWithIndex) => ({ pid, type })),
      ),
    );

    return (
      <div className={TAB_STYLES.SPACE_Y_2}>
        {/* Global Status Bar */}
        {inputPidsWithIndices.length > 0 && (
          <div className={TAB_STYLES.STATUS_BAR_CONTAINER}>
            <div className={TAB_STYLES.STATUS_BAR_CONTENT}>
              <div className={TAB_STYLES.STATUS_BAR_LEFT}>
                <span className="text-xs font-medium">Status</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {globalStatus.totalPids} stream
                  {globalStatus.totalPids > 1 ? 's' : ''}
                </span>
              </div>
              <div className={TAB_STYLES.STATUS_BAR_RIGHT}>
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
        {/* PIDs Display */}
        {allPidsWithType.length > 0 ? (
          <PIDTable
            pids={inputPidsWithIndices}
            filterIdx={filterData.idx}
            onOpenProps={handleOpenProps}
          />
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
