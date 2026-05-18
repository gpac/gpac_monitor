import { memo } from 'react';
import { useAppSelector } from '@/shared/hooks/redux';
import {
  selectSelectedPidTargets,
  selectPIDSamplesForTarget,
} from '@/shared/store/selectors';
import {
  buildPIDKey,
  type PIDMetricMode,
  type PIDGraphTarget,
} from '../../../types/pid';
import { PID_SELECTION_COLORS } from './utils/pidColors';
import PIDHistoryChart from '../../charts/PIDHistoryChart';

interface PIDChartRowProps {
  target: PIDGraphTarget;
  index: number;
  mode: PIDMetricMode;
}

const PIDChartRow = memo(({ target, index, mode }: PIDChartRowProps) => {
  const pidKey = buildPIDKey(
    target.filterIdx,
    target.direction,
    target.pidIndex,
  );
  const history = useAppSelector((state) =>
    selectPIDSamplesForTarget(state, pidKey),
  );
  const color = PID_SELECTION_COLORS[index];

  return (
    <PIDHistoryChart
      history={history}
      mode={mode}
      label={target.label ?? `PID ${target.pidIndex}`}
      color={color}
    />
  );
});

PIDChartRow.displayName = 'PIDChartRow';

interface PIDGraphPanelProps {
  mode: PIDMetricMode;
}

const PIDGraphPanel = memo(({ mode }: PIDGraphPanelProps) => {
  const targets = useAppSelector(selectSelectedPidTargets);

  return (
    <div className="flex flex-col gap-1 p-2">
      {targets.map((target, index) => (
        <PIDChartRow
          key={buildPIDKey(target.filterIdx, target.direction, target.pidIndex)}
          target={target}
          index={index}
          mode={mode}
        />
      ))}
    </div>
  );
});

PIDGraphPanel.displayName = 'PIDGraphPanel';

export default PIDGraphPanel;
