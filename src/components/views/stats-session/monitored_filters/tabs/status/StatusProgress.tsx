import { Progress } from '@/components/ui/progress';
import { MetricRow } from '../pid/shared';
import type { ProgressBar, BufferMetric } from '../../utils/statusViewModel';

export function StatusProgressBar({ bar }: { bar: ProgressBar }) {
  return (
    <div className="space-y-1 px-2 py-1 max-w-48">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{bar.key}</span>
        <span className="font-mono tabular-nums slashed-zero text-monitor">
          {bar.valueLabel}
        </span>
      </div>
      <Progress value={bar.percentage} className="h-1.5" />
    </div>
  );
}

export function StatusBufferRow({ buffer }: { buffer: BufferMetric }) {
  return (
    <MetricRow
      label="buffer"
      value={`${buffer.current} / ${buffer.max} ms`}
      title={`${buffer.percentage.toFixed(1)}%`}
      isEven
    />
  );
}
