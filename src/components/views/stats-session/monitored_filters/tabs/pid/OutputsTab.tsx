import { memo, useState } from 'react';
import { FilterStatsResponse } from '@/types/domain/gpac/filter-stats';
import { PIDTable, PIDStatusBar } from '../pid/shared';
import { TAB_STYLES } from '../styles';
import { useOutputsTabData } from '../hooks/useOutputsTabData';
import TemporalInspector from '../TemporalInspector';
import { useIsDetached } from '../../FilterViewContext';

interface OutputsTabProps {
  filterData: FilterStatsResponse;
  filterName: string;
  isLoading?: boolean;
}

const OutputsTab = memo(
  ({ filterData, filterName, isLoading = false }: OutputsTabProps) => {
    const { pidsWithIndices, globalStatus } = useOutputsTabData(filterData);
    const isDetached = useIsDetached();
    const [hoveredPidKey, setHoveredPidKey] = useState<string | null>(null);

    const handleOpenProps = () => {};

    return (
      <div className={TAB_STYLES.SPACE_Y_2}>
        {/* Global Status Bar */}
        {pidsWithIndices.length > 0 && (
          <PIDStatusBar
            totalPids={globalStatus.totalPids}
            errors={globalStatus.errors}
            active={globalStatus.active}
            eos={globalStatus.eos}
            blocked={globalStatus.blocked}
          />
        )}

        {/* PIDs Display */}
        {pidsWithIndices.length > 0 ? (
          isDetached ? (
            <PIDTable
              pids={pidsWithIndices}
              filterIdx={filterData.idx}
              onOpenProps={handleOpenProps}
              variant="output"
              hoveredPidKey={hoveredPidKey}
            />
          ) : (
            <div className="grid grid-cols-[minmax(620px,840px)_minmax(0,1fr)] gap-4">
              <PIDTable
                pids={pidsWithIndices}
                filterIdx={filterData.idx}
                onOpenProps={handleOpenProps}
                variant="output"
                hoveredPidKey={hoveredPidKey}
              />
              <TemporalInspector onHoverPid={setHoveredPidKey} />
            </div>
          )
        ) : isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground text-sm">
            No output PIDs available for {filterName}
          </div>
        )}
      </div>
    );
  },
);

OutputsTab.displayName = 'OutputsTab';

export default OutputsTab;
