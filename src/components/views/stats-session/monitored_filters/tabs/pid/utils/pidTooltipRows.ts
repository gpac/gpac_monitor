import { formatMicroseconds, formatNumber } from '@/utils/formatting';
import type { PIDBufferStats } from '../../hooks/usePIDBufferStats';
import type { PIDMetricMode } from '../../../../types/pid';

export const buildBufferTooltipRows = (
  bufferStats: PIDBufferStats,
  onMetricClick?: (metric: PIDMetricMode) => void,
  activeMetric?: PIDMetricMode,
) => [
  {
    label: 'buffer_time',
    value:
      bufferStats.buffer_time != null
        ? formatMicroseconds(bufferStats.buffer_time)
        : null,
    active: activeMetric === 'bufferTime',
    onChart: onMetricClick ? () => onMetricClick('bufferTime') : undefined,
  },
  {
    label: 'buffer',
    value: formatMicroseconds(bufferStats.buffer),
    active: activeMetric === 'buffer',
    onChart: onMetricClick ? () => onMetricClick('buffer') : undefined,
  },
  {
    label: 'max_buffer',
    value:
      bufferStats.max_buffer != null
        ? formatMicroseconds(bufferStats.max_buffer)
        : null,
  },
  {
    label: 'max_buffer_time',
    value:
      bufferStats.max_buffer_time != null
        ? formatMicroseconds(bufferStats.max_buffer_time)
        : null,
  },
  {
    label: 'nb_buffer_units',
    value:
      bufferStats.nb_buffer_units != null
        ? formatNumber(bufferStats.nb_buffer_units)
        : null,
  },
];
