import { memo, useCallback } from 'react';
import { useSidebar } from '@/shared/hooks/useSidebar';
import type { InputsTabProps, PIDWithIndex } from '../../../types';
import { useInputsTabData } from '../hooks/useInputsTabData';
import { PIDStatusBar } from './shared';
import { TAB_STYLES } from '../styles';
import PIDInlineLayout from './PIDInlineLayout';

const InputsTab = memo(
  ({ filterData, filterName, isLoading = false }: InputsTabProps) => {
    const { openPIDProps } = useSidebar();

    const { inputPidsWithIndices, groupedInputs, inputNames, globalStatus } =
      useInputsTabData(filterData);

    const handleOpenProps = useCallback(
      (filterIdx: number, pidIdx: number) => {
        openPIDProps({ filterIdx, ipidIdx: pidIdx });
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
        {inputPidsWithIndices.length > 0 && (
          <PIDStatusBar
            totalPids={globalStatus.totalPids}
            errors={globalStatus.errors}
            active={globalStatus.active}
            eos={globalStatus.eos}
          />
        )}

        {allPidsWithType.length > 0 ? (
          <PIDInlineLayout
            pids={inputPidsWithIndices}
            filterIdx={filterData.idx}
            onOpenProps={handleOpenProps}
            hoveredPidKey={null}
          />
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
