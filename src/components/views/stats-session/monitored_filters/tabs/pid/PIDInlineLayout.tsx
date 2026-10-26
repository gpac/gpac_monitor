import { memo, useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import {
  clearSelectedPidsByFilter,
  toggleSelectedPid,
} from '@/shared/store/slices/monitoredFilterSlice';
import { selectFilterPidMetricMode } from '@/shared/store/selectors/widgets/widgetsSelectors';
import { setFilterViewState } from '@/shared/store/widgets/widgetsSlice';
import type { PIDWithIndex } from '../../../types';
import type { PIDMetricMode } from '../../../types/pid';
import { PIDTable } from './shared';
import PIDGraphSection from './PIDGraphSection';
import { buildPIDDisplayLabel } from './utils/pidLabel';

interface PIDInlineLayoutProps {
  pids: PIDWithIndex[];
  filterIdx: number;
  onOpenProps: (filterIdx: number, pidIdx: number) => void;
  hoveredPidKey: string | null;
  variant?: 'input' | 'output';
}

const PIDInlineLayout = memo(
  ({
    pids,
    filterIdx,
    onOpenProps,
    hoveredPidKey,
    variant = 'input',
  }: PIDInlineLayoutProps) => {
    const dispatch = useAppDispatch();
    const mode = useAppSelector((state) =>
      selectFilterPidMetricMode(state, filterIdx),
    );
    const setMode = useCallback(
      (pidMetricMode: PIDMetricMode) =>
        dispatch(setFilterViewState({ filterIdx, patch: { pidMetricMode } })),
      [dispatch, filterIdx],
    );
    const hasDefaultedRef = useRef(false);

    useEffect(
      () => () => {
        hasDefaultedRef.current = false;
        dispatch(clearSelectedPidsByFilter(filterIdx));
      },
      [dispatch, filterIdx],
    );

    // Selection is empty on mount (cleared on unmount above):
    // select the first PID once so the graph shows by default.
    useEffect(() => {
      const firstPid = pids[0];
      if (hasDefaultedRef.current || !firstPid) return;
      hasDefaultedRef.current = true;
      dispatch(
        toggleSelectedPid({
          filterIdx,
          direction: variant,
          pidIndex: firstPid.pidIdx,
          label: buildPIDDisplayLabel(firstPid),
        }),
      );
    }, [dispatch, filterIdx, variant, pids]);

    return (
      <div className="flex flex-col gap-2">
        <PIDTable
          pids={pids}
          filterIdx={filterIdx}
          onOpenProps={onOpenProps}
          variant={variant}
          hoveredPidKey={hoveredPidKey}
          activeMetric={mode}
          onMetricClick={setMode}
        />
        <PIDGraphSection
          filterIdx={filterIdx}
          mode={mode}
          onModeChange={setMode}
          totalPids={pids.length}
        />
      </div>
    );
  },
);

PIDInlineLayout.displayName = 'PIDInlineLayout';

export default PIDInlineLayout;
