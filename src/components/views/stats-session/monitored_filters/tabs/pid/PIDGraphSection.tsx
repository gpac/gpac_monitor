import { memo } from 'react';
import { useAppSelector } from '@/shared/hooks/redux';
import { selectSelectedPidTargets } from '@/shared/store/selectors';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { PIDMetricMode } from '../../../types/pid';
import PIDChipsStrip from './PIDChipsStrip';
import PIDGraphPanel from './PIDGraphPanel';

const METRIC_LABELS: Record<PIDMetricMode, string> = {
  bitrate: 'Avg Bitrate',
  buffer: 'Buffer',
  processTime: 'Proc. Time',
  processRate: 'Proc. Rate',
  ts: 'TS',
};

interface PIDGraphSectionProps {
  mode: PIDMetricMode;
  onHoverPid: (key: string | null) => void;
}

const PIDGraphSection = memo(({ mode, onHoverPid }: PIDGraphSectionProps) => {
  const targets = useAppSelector(selectSelectedPidTargets);

  if (targets.length === 0) return null;

  const metricLabel = METRIC_LABELS[mode];

  return (
    <Card className="bg-monitor-panel border-transparent">
      <CardHeader className="pb-1 px-3 pt-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
          PID Metrics
        </p>
        <div className="flex items-center flex-wrap gap-x-1.5 gap-y-1 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {metricLabel}
            <span className="mx-1 opacity-40">·</span>
            Live <span className="text-error">⏺</span>
          </span>
          <PIDChipsStrip onHoverPid={onHoverPid} />
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
