import { memo, useMemo } from 'react';
import { useAppSelector } from '@/shared/hooks/redux';
import { selectAllSelectedPidSamples } from '@/shared/store/selectors';
import type { PIDMetricMode } from '../../../types/pid';
import { PID_SELECTION_COLORS } from './utils/pidColors';
import PIDHistoryChart, {
  type PIDSeriesEntry,
} from '../../charts/PIDHistoryChart';

const MODE_LABELS: Record<PIDMetricMode, string> = {
  bitrate: 'Avg Bitrate',
  bufferTime: 'Buffer',
  processTime: 'Proc.',
  processRate: 'Proc. Rate',
  ts: 'TS',
};

interface PIDGraphPanelProps {
  mode: PIDMetricMode;
  showEndLabels: boolean;
}

const PIDGraphPanel = memo(({ mode, showEndLabels }: PIDGraphPanelProps) => {
  const allSamples = useAppSelector(selectAllSelectedPidSamples);

  const entries = useMemo<PIDSeriesEntry[]>(
    () =>
      allSamples.map(({ target, pidHistory }, index) => {
        const typeStr = target.streamTypeLabel
          ? ` (${target.streamTypeLabel})`
          : '';
        return {
          pidHistory,
          label: `PID ${target.pidIndex}${typeStr}`,
          metricLabel: MODE_LABELS[mode],
          color: PID_SELECTION_COLORS[index],
        };
      }),
    [allSamples, mode],
  );

  if (entries.length === 0) return null;

  return (
    <div className="p-2">
      <PIDHistoryChart
        entries={entries}
        mode={mode}
        showEndLabels={showEndLabels}
      />
    </div>
  );
});

PIDGraphPanel.displayName = 'PIDGraphPanel';

export default PIDGraphPanel;
