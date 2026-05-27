import { memo, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { useChartDuration } from '@/shared/hooks';
import { selectSelectedPidTargetsByFilter } from '@/shared/store/selectors';
import { toggleSelectedPid } from '@/shared/store/slices/monitoredFilterSlice';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { WindowDurationBadge } from '@/components/common/WindowDurationBadge';
import { useIsDetached } from '../../FilterViewContext';
import type { PIDMetricMode } from '../../../types/pid';
import {
  getFilterColor,
  DEFAULT_STREAM_COLOR,
} from '@/utils/filters/streamType';
import { CLICKABLE_METRICS } from './PIDTable';
import PIDGraphPanel from './PIDGraphPanel';

const METRIC_LABELS: Record<PIDMetricMode, string> = {
  bitrate: 'Avg Bitrate',
  bufferTime: 'Buffer',
  processTime: 'Proc. Time',
  processRate: 'Proc. Rate',
  ts: 'Last Proc.',
};

interface PIDGraphSectionProps {
  filterIdx: number;
  mode: PIDMetricMode;
  onModeChange: (mode: PIDMetricMode) => void;
  totalPids: number;
}

const PIDGraphSection = memo(
  ({ filterIdx, mode, onModeChange, totalPids }: PIDGraphSectionProps) => {
    const dispatch = useAppDispatch();
    const targets = useAppSelector((state) =>
      selectSelectedPidTargetsByFilter(state, filterIdx),
    );

    const isDetached = useIsDetached();
    const { duration, setDuration, maxPoints } = useChartDuration(
      'pid_graph_duration',
      '5min',
      1000,
    );

    const usesGraphMetricSelector = totalPids >= 4 || targets.length >= 4;
    const shouldShowEndLabels = !isDetached && targets.length < 4;

    const pidLabels = useMemo(
      () =>
        targets.length >= 1
          ? targets.map((target) => ({
              target,
              color: target.streamType
                ? getFilterColor(target.streamType)
                : DEFAULT_STREAM_COLOR,
              label: target.label ?? `#${target.pidIndex}`,
            }))
          : null,
      [targets],
    );

    if (targets.length === 0) return null;

    return (
      <Card className="bg-monitor-panel border-t-monitor-line border-transparent">
        <CardHeader className="pb-1 px-3 pt-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              {METRIC_LABELS[mode]}
            </p>
            <div className="flex items-center gap-1">
              {!isDetached && (
                <WindowDurationBadge
                  value={duration}
                  onChange={setDuration}
                  options={['1min', '5min']}
                />
              )}
              {usesGraphMetricSelector && (
                <ToggleGroup
                  type="single"
                  value={mode}
                  onValueChange={(v) => v && onModeChange(v as PIDMetricMode)}
                  className="flex gap-0.5 p-0 bg-transparent border-0"
                >
                  {CLICKABLE_METRICS.map(({ metric, label }) => (
                    <ToggleGroupItem
                      key={metric}
                      value={metric}
                      aria-pressed={mode === metric}
                      className="h-auto px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                    >
                      {label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              )}
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-x-1.5 gap-y-1 mt-0.5">
            <span className="text-xs text-muted-foreground">
              PID Metrics
              <span className="mx-1 opacity-40">·</span>
              Live <span className="text-error">⏺</span>
              {targets.length > 0 && (
                <>
                  <span className="mx-1 opacity-40">·</span>
                  {targets.length} selected PID{targets.length > 1 ? 's' : ''}
                </>
              )}
            </span>
            {pidLabels && (
              <ToggleGroup
                type="multiple"
                value={pidLabels.map((_, i) => String(i))}
                className="flex flex-wrap gap-1 p-0 bg-monitor-line/10 border-0 border-monitor-surface/70 rounded-md"
              >
                {pidLabels.map((item, index) => (
                  <ToggleGroupItem
                    key={index}
                    value={String(index)}
                    onClick={() => dispatch(toggleSelectedPid(item.target))}
                    className="flex items-center gap-1 h-auto px-1.5 py-0.5 text-[10px] font-mono"
                    style={{
                      borderColor: `${item.color}60`,
                      background: `${item.color}15`,
                      color: item.color,
                    }}
                  >
                    <span
                      className="w-2 h-0.5 rounded-full flex-shrink-0"
                      style={{ background: item.color }}
                    />
                    <span>{item.label}</span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-2 pt-0">
          <PIDGraphPanel
            filterIdx={filterIdx}
            mode={mode}
            showEndLabels={shouldShowEndLabels}
            maxPoints={maxPoints}
          />
        </CardContent>
      </Card>
    );
  },
);

PIDGraphSection.displayName = 'PIDGraphSection';

export default PIDGraphSection;
