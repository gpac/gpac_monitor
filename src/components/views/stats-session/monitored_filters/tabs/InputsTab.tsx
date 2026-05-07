import { memo, useCallback } from 'react';
import { useSidebar } from '@/shared/hooks/useSidebar';
import type { InputsTabProps, PIDWithIndex } from '../../types';
import { useInputsTabData } from './hooks/useInputsTabData';
import { PIDTable, PIDStatusBar } from './shared';
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
          <PIDStatusBar
            totalPids={globalStatus.totalPids}
            errors={globalStatus.errors}
            active={globalStatus.active}
            eos={globalStatus.eos}
          />
        )}

        {/* PIDs Display */}
        {allPidsWithType.length > 0 ? (
          <div className="grid grid-cols-[minmax(620px,840px)_minmax(0,1fr)] gap-4">
            <PIDTable
              pids={inputPidsWithIndices}
              filterIdx={filterData.idx}
              onOpenProps={handleOpenProps}
            />

            {/* Future PID graph panel */}
            <div />
          </div>
        ) : isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-" />
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
