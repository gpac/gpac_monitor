import { memo, useCallback, useEffect, useRef } from 'react';
import { useStore } from 'react-redux';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import type { RootState } from '@/shared/store';
import {
  clearSelectedPidsByFilter,
  toggleSelectedPid,
} from '@/shared/store/slices/monitoredFilterSlice';
import { selectSelectedPidTargetsByFilter } from '@/shared/store/selectors/monitoredFilter';
import {
  selectFilterPidMetricMode,
  selectFilterViewModes,
} from '@/shared/store/selectors/widgets/widgetsSelectors';
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
  previewPidIdxs: number[];
  onTogglePreview: (pidIdx: number) => void;
}

const PIDInlineLayout = memo(
  ({
    pids,
    filterIdx,
    onOpenProps,
    hoveredPidKey,
    variant = 'input',
    previewPidIdxs,
    onTogglePreview,
  }: PIDInlineLayoutProps) => {
    const dispatch = useAppDispatch();
    const store = useStore<RootState>();
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
        if (selectFilterViewModes(store.getState())[filterIdx]) return;
        dispatch(clearSelectedPidsByFilter(filterIdx));
      },
      [dispatch, filterIdx, store],
    );

    // Selection survives detach/reattach; default to the first PID
    // only when the filter has none, so the graph shows by default.
    useEffect(() => {
      const firstPid = pids[0];
      if (hasDefaultedRef.current || !firstPid) return;
      hasDefaultedRef.current = true;
      if (selectSelectedPidTargetsByFilter(store.getState(), filterIdx).length)
        return;
      dispatch(
        toggleSelectedPid({
          filterIdx,
          direction: variant,
          pidIndex: firstPid.pidIdx,
          label: buildPIDDisplayLabel(firstPid),
        }),
      );
    }, [dispatch, filterIdx, variant, pids, store]);

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
          previewPidIdxs={previewPidIdxs}
          onTogglePreview={onTogglePreview}
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
