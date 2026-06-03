import { Progress } from '@/components/ui/progress';
import { MetricRow } from '../pid/shared';
import type { ProgressBar, BufferMetric } from '../../utils/statusViewModel';

export function StatusProgressRow({ bar }: { bar: ProgressBar }) {
  return (
    <tr className="bg-monitor-panel border-b border-transparent">
      <td colSpan={2} className="px-2 py-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground shrink-0">
            {bar.key}
          </span>
          <span className="text-xs font-mono tabular-nums text-monitor shrink-0">
            {bar.valueLabel}
          </span>
          <Progress
            value={bar.percentage}
            className="w-24 shrink-0 h-1.5"
            color="bg-info"
          />
        </div>
      </td>
    </tr>
  );
}

export function StatusBufferRow({ buffer }: { buffer: BufferMetric }) {
  return (
    <MetricRow
      label="buffer"
      value={`${buffer.current} / ${buffer.max} ms`}
      title={`${buffer.percentage.toFixed(1)}%`}
    />
  );
}
