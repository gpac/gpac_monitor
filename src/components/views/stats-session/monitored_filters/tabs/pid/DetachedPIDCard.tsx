import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { getPIDStatusBadge } from '@/utils/gpac';
import { getStreamTypeBadgeConfig } from '@/utils/filters/streamType';
import {
  formatPidBuffer,
  formatPidBitrate,
  formatLastTsSent,
} from './utils/pidFormatters';
import { formatNumber } from '@/utils/formatting';
import { buildPIDKey } from '../../../types/pid';
import type { PIDWithIndex } from '../../../types';
import { PID_SELECTION_COLORS } from './utils/pidColors';
import { usePIDInfoStats } from '../hooks/usePIDInfoStats';
import { usePIDBufferStats } from '../hooks/usePIDBufferStats';
import { usePIDPerformanceStats } from '../hooks/usePIDPerformanceStats';
import PIDMetricTooltip from './PIDMetricTooltip';
import { useAppSelector } from '@/shared/hooks/redux';
import { selectPidColorIndexByKey } from '@/shared/store/selectors';

type Variant = 'input' | 'output';

interface DetachedPIDCardProps {
  pid: PIDWithIndex;
  filterIdx: number;
  variant?: Variant;
  wide?: boolean;
}

const LABEL =
  'text-[10px] font-medium text-muted-foreground uppercase tracking-wide self-center';
const VALUE = 'text-xs text-info cursor-default py-1 block';

const DetachedPIDCard = memo(
  ({
    pid,
    filterIdx,
    variant = 'input',
    wide = false,
  }: DetachedPIDCardProps) => {
    const infoStats = usePIDInfoStats(pid);
    const bufferStats = usePIDBufferStats(pid);
    const perfStats = usePIDPerformanceStats(pid);

    const statusBadge = getPIDStatusBadge(pid);
    const badgeConfig = getStreamTypeBadgeConfig(pid.type);
    const pidKey = buildPIDKey(filterIdx, variant, pid.ipidIdx);
    const colorIndex = useAppSelector(
      (state) => selectPidColorIndexByKey(state)[pidKey] ?? -1,
    );
    const isSelected = colorIndex >= 0;

    const borderStyle = isSelected
      ? { borderLeft: `3px solid ${PID_SELECTION_COLORS[colorIndex]}` }
      : { borderLeft: '3px solid transparent' };

    const gridClass = wide
      ? 'grid-rows-[auto_auto] grid-flow-col gap-x-6 gap-y-0.5'
      : 'grid-cols-[max-content_2fr] gap-x-3';
    const sep = wide ? 'hidden' : 'col-span-2 h-px bg-white/5 my-0.5';

    return (
      <div
        className={`bg-monitor-app border border-white/5 rounded px-2 py-1.5 grid tabular-nums ${gridClass}`}
        style={borderStyle}
        data-pid-key={pidKey}
      >
        <span className={LABEL}>Infos</span>
        <div className="flex items-center gap-1.5 py-1 min-w-0">
          <Badge
            variant="outline"
            className={`px-1.5 py-0 h-5 font-mono font-bold text-[10px] flex-shrink-0 ${badgeConfig.className}`}
          >
            {badgeConfig.label}
          </Badge>
          <span className="text-xs text-muted-foreground truncate">
            {infoStats.infoLine}
          </span>
          {statusBadge && (
            <Badge
              variant={statusBadge.variant}
              className="text-xs px-1 py-0 h-4 font-normal flex-shrink-0"
            >
              {statusBadge.text}
            </Badge>
          )}
        </div>

        <div className={sep} />

        <span className={LABEL}>Buffer</span>
        <PIDMetricTooltip
          rows={[
            {
              label: 'buffer_time',
              value:
                bufferStats.buffer_time != null
                  ? formatPidBuffer(bufferStats.buffer_time)
                  : null,
              active: true,
            },
            { label: 'buffer', value: formatPidBuffer(bufferStats.buffer) },
            {
              label: 'max_buffer',
              value:
                bufferStats.max_buffer != null
                  ? formatPidBuffer(bufferStats.max_buffer)
                  : null,
            },
            {
              label: 'max_buffer_time',
              value:
                bufferStats.max_buffer_time != null
                  ? formatPidBuffer(bufferStats.max_buffer_time)
                  : null,
            },
            {
              label: 'nb_buffer_units',
              value:
                bufferStats.nb_buffer_units != null
                  ? formatNumber(bufferStats.nb_buffer_units)
                  : null,
            },
          ]}
        >
          <span className={VALUE}>
            {formatPidBuffer(bufferStats.displayBuffer)}
          </span>
        </PIDMetricTooltip>

        <div className={sep} />

        <span className={LABEL}>Avg Bitrate</span>
        <PIDMetricTooltip
          rows={[
            {
              label: 'average_bitrate',
              value: formatPidBitrate(perfStats.average_bitrate),
              active: true,
            },
            { label: 'bitrate', value: formatPidBitrate(perfStats.bitrate) },
            {
              label: 'max_bitrate',
              value: formatPidBitrate(perfStats.max_bitrate),
            },
          ]}
        >
          <span className={VALUE}>
            {formatPidBitrate(perfStats.average_bitrate)}
          </span>
        </PIDMetricTooltip>

        <div className={sep} />

        <span className={LABEL}>Proc.</span>
        <PIDMetricTooltip
          rows={[
            {
              label: 'avg_process_time',
              value:
                perfStats.average_process_time != null
                  ? formatPidBuffer(perfStats.average_process_time)
                  : null,
              active: true,
            },
            {
              label: 'max_process_time',
              value: formatPidBuffer(perfStats.max_process_time),
            },
            {
              label: 'nb_processed',
              value:
                perfStats.nb_processed > 0
                  ? formatNumber(perfStats.nb_processed)
                  : null,
            },
          ]}
        >
          <span className={VALUE}>
            {perfStats.average_process_time != null
              ? formatPidBuffer(perfStats.average_process_time)
              : '—'}
          </span>
        </PIDMetricTooltip>

        <div className={sep} />

        <span className={LABEL}>Proc. Rate</span>
        <PIDMetricTooltip
          rows={[
            {
              label: 'avg process rate',
              value: formatPidBitrate(perfStats.average_process_rate),
              active: true,
            },
            {
              label: 'max process rate',
              value: formatPidBitrate(perfStats.max_process_rate),
            },
          ]}
        >
          <span className={VALUE}>
            {formatPidBitrate(perfStats.average_process_rate)}
          </span>
        </PIDMetricTooltip>

        <div className={sep} />

        <span className={LABEL}>TS</span>
        <PIDMetricTooltip
          rows={[
            {
              label: 'last_ts_sent',
              value: formatLastTsSent(perfStats.last_ts_sent),
              active: true,
            },
            {
              label: 'first_process_time',
              value:
                perfStats.first_process_time != null
                  ? formatPidBuffer(perfStats.first_process_time)
                  : null,
            },
            {
              label: 'last_process_time',
              value:
                perfStats.last_process_time != null
                  ? formatPidBuffer(perfStats.last_process_time)
                  : null,
            },
          ]}
        >
          <span className={`${VALUE} font-mono`}>
            {formatLastTsSent(perfStats.last_ts_sent)}
          </span>
        </PIDMetricTooltip>
      </div>
    );
  },
);

DetachedPIDCard.displayName = 'DetachedPIDCard';
export default DetachedPIDCard;
