export interface SeriesDef {
  label: string;
  color: string;
  formatValue?: (value: number) => string;
  yAxis?: 'left' | 'right';
  fill?: string;
  strokeWidth?: number;
  metricLabel?: string;
}

export interface AxisConfig {
  formatY: (value: number) => string;
  color?: string;
  gridStroke?: string;
  range?: [number, number];
  size?: number;
}

export interface EndLabelInfo {
  top: number;
  value: string;
  color: string;
  label: string;
}
