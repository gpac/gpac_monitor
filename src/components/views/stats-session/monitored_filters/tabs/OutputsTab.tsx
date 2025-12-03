import { memo, useMemo } from 'react';
import { FilterStatsResponse } from '@/types/domain/gpac/filter-stats';
import { Badge } from '@/components/ui/badge';
import { getGlobalStatus } from '@/utils/gpac';
import PIDMetricsCard from './PIDMetricsCard';
import type { PIDWithIndex } from '../../types';
import { TAB_STYLES } from './styles';

interface OutputsTabProps {
  filterData: FilterStatsResponse;
  filterName: string;
  isLoading?: boolean;
}

const OutputsTab = memo(
  ({ filterData, filterName, isLoading = false }: OutputsTabProps) => {
    // Add index to each PID for properties lookup
    const pidsWithIndices = useMemo((): PIDWithIndex[] => {
      if (!filterData.opids) return [];
      return Object.entries(filterData.opids).map(([_key, pid], index) => ({
        ...pid,
        ipidIdx: index,
      }));
    }, [filterData.opids]);

    // Create type-annotated list for grid mode
    const allPidsWithType = useMemo(
      () =>
        pidsWithIndices.map((pid) => ({ pid, type: pid.type || 'Unknown' })),
      [pidsWithIndices],
    );

    const globalStatus = getGlobalStatus(
      pidsWithIndices,
      pidsWithIndices.length,
    );

    // Noop handler for outputs (no sidebar action needed)
    const handleOpenProps = () => {};

    return (
      <div className={TAB_STYLES.SPACE_Y_2}>
        {/* Global Status Bar */}
        {pidsWithIndices.length > 0 && (
          <div className={TAB_STYLES.STATUS_BAR_CONTAINER}>
            <div className={TAB_STYLES.STATUS_BAR_CONTENT}>
              <div className={TAB_STYLES.STATUS_BAR_LEFT}>
                <span className="text-xs font-medium">Status</span>
                <span className="text-xs text-info tabular-nums">
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
                {globalStatus.blocked > 0 && (
                  <Badge
                    variant="destructive"
                    className="text-[10px] px-1.5 py-0 h-5 tabular-nums bg-amber-900/40 text-amber-300 border-amber-700/60"
                    title="Output PIDs blocked - backpressure active"
                  >
                    {globalStatus.blocked} Blocked
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

        {/* PIDs Display - Grid mode */}
        {allPidsWithType.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-2">
            {allPidsWithType.map(({ pid, type }) => (
              <PIDMetricsCard
                key={`${pid.name}-${pid.ipidIdx}`}
                pid={pid}
                type={type}
                filterIdx={filterData.idx}
                onOpenProps={handleOpenProps}
                variant="output"
              />
            ))}
          </div>
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
