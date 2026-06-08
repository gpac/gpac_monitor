import { Badge } from '@/components/ui/badge';
import { TAB_STYLES } from '../styles';
export { default as PIDTable } from './PIDTable';
export { MetricRow, TableSection } from '../shared/tableLayout';

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
  <div className={`${TAB_STYLES.FILTER_STATUS_WIDGET} w-[60%]`}>
    <div className={TAB_STYLES.STATUS_BAR_CONTENT}>
      <div className={TAB_STYLES.STATUS_BAR_LEFT}>
        <span className="text-xs font-medium">Status</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {totalPids} stream{totalPids > 1 ? 's' : ''}
        </span>
      </div>
      <div className={TAB_STYLES.STATUS_BAR_RIGHT}>
        {errors > 0 && (
          <Badge variant="destructive" className={TAB_STYLES.BADGE_TINY}>
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
          <Badge variant="default" className={TAB_STYLES.BADGE_TINY}>
            {active} Active
          </Badge>
        )}
        {eos > 0 && (
          <Badge variant="secondary" className={TAB_STYLES.BADGE_TINY}>
            {eos} EOS
          </Badge>
        )}
      </div>
    </div>
  </div>
);
