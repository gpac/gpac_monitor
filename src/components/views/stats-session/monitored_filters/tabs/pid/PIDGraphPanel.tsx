import { memo, useMemo } from 'react';
import { useAppSelector } from '@/shared/hooks/redux';
import { selectAllSelectedPidSamplesByFilter } from '@/shared/store/selectors';
import type { PIDMetricMode } from '../../../types/pid';
import {
  getFilterColor,
  DEFAULT_STREAM_COLOR,
} from '@/utils/filters/streamType';
import PIDHistoryChart, {
  type PIDSeriesEntry,
} from '../../charts/PIDHistoryChart';

const MODE_LABELS: Record<PIDMetricMode, string> = {
  bitrate: 'Avg Bitrate',
  bufferTime: 'Buffer',
  processTime: 'Proc.',
  processRate: 'Proc. Rate',
  ts: 'Last Proc.',
};

interface PIDGraphPanelProps {
  filterIdx: number;
  mode: PIDMetricMode;
  showEndLabels: boolean;
  maxPoints?: number;
}

const PIDGraphPanel = memo(
  ({ filterIdx, mode, showEndLabels, maxPoints }: PIDGraphPanelProps) => {
    const allSamples = useAppSelector((state) =>
      selectAllSelectedPidSamplesByFilter(state, filterIdx),
    );

    const entries = useMemo<PIDSeriesEntry[]>(
      () =>
        allSamples.map(({ target, pidHistory }) => {
          const typeStr = target.streamTypeLabel
            ? ` (${target.streamTypeLabel})`
            : '';
          const sliced =
            maxPoints != null ? pidHistory.slice(-maxPoints) : pidHistory;
          return {
            pidHistory: sliced,
            label: `PID ${target.pidIndex}${typeStr}`,
            metricLabel: MODE_LABELS[mode],
            color: target.streamType
              ? getFilterColor(target.streamType)
              : DEFAULT_STREAM_COLOR,
          };
        }),
      [allSamples, mode, maxPoints],
    );

    if (entries.length === 0) return null;

    return (
      <div className="p-2">
        <PIDHistoryChart
          entries={entries}
          mode={mode}
          showEndLabels={showEndLabels}
          showCurrentTime
        />
      </div>
    );
  },
);

PIDGraphPanel.displayName = 'PIDGraphPanel';

export default PIDGraphPanel;
