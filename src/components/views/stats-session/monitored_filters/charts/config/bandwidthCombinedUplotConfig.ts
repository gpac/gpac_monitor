import type React from 'react';
import { formatBitrate } from '@/utils/formatting/numbers';
import { formatMicroseconds } from '@/utils/formatting';
import {
  createLineChartConfig,
  type SeriesDef,
} from '@/components/common/charts';

export interface BandwidthCombinedConfigParams {
  timeLabelsRef: React.MutableRefObject<string[]>;
  width?: number;
  height?: number;
}

const formatBw = (v: number) => formatBitrate(v * 8);

const BANDWIDTH_SERIES: SeriesDef[] = [
  { label: 'Outband', color: '#10b981', formatValue: formatBw },
  { label: 'Inband', color: '#3b82f6', formatValue: formatBw },
  {
    label: 'Filter Proc. Time',
    color: '#f59e0b',
    formatValue: formatMicroseconds,
    yAxis: 'right',
  },
];

export const createBandwidthCombinedConfig = ({
  timeLabelsRef,
  width = 400,
  height = 180,
}: BandwidthCombinedConfigParams) =>
  createLineChartConfig({
    series: BANDWIDTH_SERIES,
    formatY: formatBw,
    rightAxis: { formatY: formatMicroseconds },
    timeLabelsRef,
    width,
    height,
  });
