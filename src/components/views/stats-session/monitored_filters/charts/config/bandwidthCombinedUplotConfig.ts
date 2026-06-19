import { formatBitrate } from '@/utils/formatting/numbers';
import { formatMicroseconds } from '@/utils/formatting';
import { type SeriesDef } from '@/components/common/charts';

export const formatBw = (value: number) => formatBitrate(value * 8);

export const BANDWIDTH_SERIES: SeriesDef[] = [
  { label: 'Outband', color: '#10b981', formatValue: formatBw },
  { label: 'Inband', color: '#3b82f6', formatValue: formatBw },
  {
    label: 'Filter Proc. Time',
    color: '#f59e0b',
    formatValue: formatMicroseconds,
    yAxis: 'right',
  },
];
