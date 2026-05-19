import { memo, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import {
  selectSelectedPidTargets,
  selectAllSelectedPidSamples,
} from '@/shared/store/selectors';
import { toggleSelectedPid } from '@/shared/store/slices/monitoredFilterSlice';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  formatBitrate,
  formatBufferTime,
  formatMicroseconds,
  formatPacketRate,
} from '@/utils/formatting';
import type { PIDMetricMode, PIDMetricSample } from '../../../types/pid';
import { PID_SELECTION_COLORS } from './utils/pidColors';
import PIDGraphPanel from './PIDGraphPanel';

const METRIC_LABELS: Record<PIDMetricMode, string> = {
  bitrate: 'Avg Bitrate',
  bufferTime: 'Buffer',
  processTime: 'Proc. Time',
  processRate: 'Proc. Rate',
  ts: 'TS',
};

const METRIC_FORMATTERS: Record<PIDMetricMode, (v: number) => string> = {
  bitrate: formatBitrate,
  bufferTime: formatBufferTime,
  processTime: formatMicroseconds,
  processRate: formatPacketRate,
  ts: formatMicroseconds,
};

const getLastValue = (
  history: PIDMetricSample[],
  mode: PIDMetricMode,
): string | null => {
  const last = history[history.length - 1];
  if (!last) return null;
  const raw = (
    {
      bitrate: last.averageBitrate,
      bufferTime: last.bufferTime,
      processTime: last.processTime,
      processRate: last.processRate,
      ts: last.ts,
    } as Record<PIDMetricMode, number | null | undefined>
  )[mode];
  return raw != null ? METRIC_FORMATTERS[mode](raw) : null;
};

interface PIDGraphSectionProps {
  mode: PIDMetricMode;
  onHoverPid: (key: string | null) => void;
}

const PIDGraphSection = memo(({ mode }: PIDGraphSectionProps) => {
  const dispatch = useAppDispatch();
  const targets = useAppSelector(selectSelectedPidTargets);
  const allSamples = useAppSelector(selectAllSelectedPidSamples);

  const pidLabels = useMemo(
    () =>
      allSamples.length >= 1
        ? allSamples.map(({ target, pidHistory }, index) => ({
            target,
            color: PID_SELECTION_COLORS[index],
            label: target.label ?? `#${target.pidIndex}`,
            value: getLastValue(pidHistory, mode),
          }))
        : null,
    [allSamples, mode],
  );

  if (targets.length === 0) return null;

  return (
    <Card className="bg-monitor-panel border-transparent">
      <CardHeader className="pb-1 px-3 pt-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
          PID Metrics
        </p>
        <div className="flex items-center flex-wrap gap-x-1.5 gap-y-1 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {METRIC_LABELS[mode]}
            <span className="mx-1 opacity-40">·</span>
            Live <span className="text-error">⏺</span>
          </span>
          {pidLabels && (
            <ToggleGroup
              type="multiple"
              value={pidLabels.map((_, i) => String(i))}
              className="flex flex-wrap gap-1 p-0 bg-transparent border-0"
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
                  {item.value != null && (
                    <span className="text-info ml-0.5">{item.value}</span>
                  )}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-2 pt-0">
        <PIDGraphPanel mode={mode} />
      </CardContent>
    </Card>
  );
});

PIDGraphSection.displayName = 'PIDGraphSection';

export default PIDGraphSection;
