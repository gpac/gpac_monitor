import { type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { TAB_STYLES } from './styles';
export { default as PIDTable } from './PIDTable';

interface PIDStatusBarProps {
  totalPids: number;
  errors: number;
  active: number;
  eos: number;
  blocked?: number;
}

export const PIDStatusBar = ({
  totalPids,
  errors,
  active,
  eos,
  blocked,
}: PIDStatusBarProps) => (
  <div className={`{TAB_STYLES.STATUS_BAR_CONTAINER} w-[60%]`}>
    <div className={TAB_STYLES.STATUS_BAR_CONTENT}>
      <div className={TAB_STYLES.STATUS_BAR_LEFT}>
        <span className="text-xs font-medium">Status</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {totalPids} stream{totalPids > 1 ? 's' : ''}
        </span>
      </div>
      <div className={TAB_STYLES.STATUS_BAR_RIGHT}>
        {errors > 0 && (
          <Badge
            variant="destructive"
            className="text-[10px] px-1.5 py-0 h-5 tabular-nums"
          >
            {errors} Error
          </Badge>
        )}
        {(blocked ?? 0) > 0 && (
          <Badge
            variant="destructive"
            className="text-[10px] px-1.5 py-0 h-5 tabular-nums bg-amber-900/40 text-amber-300 border-amber-700/60"
            title="Output PIDs blocked - backpressure active"
          >
            {blocked} Blocked
          </Badge>
        )}
        {active > 0 && (
          <Badge
            variant="default"
            className="text-[10px] px-1.5 py-0 h-5 tabular-nums"
          >
            {active} Active
          </Badge>
        )}
        {eos > 0 && (
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 h-5 tabular-nums"
          >
            {eos} EOS
          </Badge>
        )}
      </div>
    </div>
  </div>
);

export const MetricRow = ({
  label,
  value,
  isEven,
  valueClassName = 'text-info',
}: {
  label: string;
  value: string;
  isEven: boolean;
  valueClassName?: string;
}) => (
  <tr
    className={`${isEven ? 'bg-black/10' : 'bg-black/20'} border-b border-white/5`}
  >
    <td className="px-2 py-2 align-middle text-xs text-muted-foreground">
      {label}
    </td>
    <td
      className={`px-2 py-2 align-middle text-xs font-medium tabular-nums text-right w-28 whitespace-nowrap ${valueClassName}`}
    >
      {value}
    </td>
  </tr>
);

export const TableSection = ({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: ReactNode;
  children: ReactNode;
}) => (
  <div className="bg-monitor-app">
    <table className="w-full text-left table-fixed">
      <colgroup>
        <col />
        <col className="w-28" />
      </colgroup>
      <thead>
        <tr className="bg-monitor-panel border-b border-white/10">
          <th
            colSpan={2}
            className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide"
          >
            <div className="flex items-center justify-between">
              <span>{title}</span>
              {badge}
            </div>
          </th>
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);
