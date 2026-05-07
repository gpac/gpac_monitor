import { memo } from 'react';
import { FilterStatsResponse } from '@/types/domain/gpac/filter-stats';
import { PIDTable, PIDStatusBar } from './shared';
import { TAB_STYLES } from './styles';
import { useOutputsTabData } from './hooks/useOutputsTabData';

interface OutputsTabProps {
  filterData: FilterStatsResponse;
  filterName: string;
  isLoading?: boolean;
}

const OutputsTab = memo(
  ({ filterData, filterName, isLoading = false }: OutputsTabProps) => {
    const { pidsWithIndices, globalStatus } = useOutputsTabData(filterData);

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
          <PIDTable
            pids={pidsWithIndices}
            filterIdx={filterData.idx}
            onOpenProps={handleOpenProps}
            variant="output"
          />
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
