import uPlot from 'uplot';
import type React from 'react';

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

export interface LineChartConfigOptions {
  series: SeriesDef[];
  leftAxis?: AxisConfig;
  rightAxis?: AxisConfig;
  /** index-based x-axis: labels come from this ref */
  timeLabelsRef?: React.MutableRefObject<string[]>;
  /** real-timestamp x-axis: formats raw x values directly */
  formatX?: (v: number) => string;
  /** @deprecated use leftAxis.formatY */
  formatY?: (v: number) => string;
  width: number;
  height: number;
}

const tooltipIdxMap = new WeakMap<uPlot, number | null>();

const TOOLTIP_STYLE = `
  position: absolute;
  background: rgb(17 24 39);
  color: rgb(209 213 219);
  border: 1px solid rgb(55 65 81);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 11px;
  font-family: monospace;
  pointer-events: none;
  z-index: 100;
  white-space: nowrap;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.3);
`;

const DEFAULT_GRID = 'rgba(110, 231, 183, 0.1)';

export const createLineChartConfig = ({
  series,
  leftAxis,
  rightAxis,
  formatY = String,
  timeLabelsRef,
  formatX,
  width,
  height,
}: LineChartConfigOptions): uPlot.Options => {
  const hasRightAxis =
    rightAxis != null && series.some((def) => def.yAxis === 'right');
  const rightColor =
    rightAxis?.color ??
    series.find((def) => def.yAxis === 'right')?.color ??
    '#6ee7b7';
  const leftFmt = leftAxis?.formatY ?? formatY;
  const leftColor = leftAxis?.color ?? '#6ee7b7';

  const getTimeLabel = (u: uPlot, idx: number): string => {
    if (formatX) return formatX(u.data[0][idx] as number);
    if (timeLabelsRef) return timeLabelsRef.current[idx] ?? '--';
    return '--';
  };

  return {
    width,
    height,
    padding: [10, 10, 5, 5],
    cursor: {
      show: true,
      drag: { x: false, y: false },
      points: { size: 8, width: 2 },
    },
    legend: { show: false },
    hooks: {
      setCursor: [
        (u) => {
          const { left = 0, top = 0, idx } = u.cursor;
          let tooltip = u.root.querySelector(
            '.u-tooltip',
          ) as HTMLElement | null;
          if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'u-tooltip';
            tooltip.style.cssText = TOOLTIP_STYLE;
            u.root.appendChild(tooltip);
          }
          if (idx == null) return;
          const lastIdx = tooltipIdxMap.get(u) ?? null;
          if (lastIdx === idx) {
            tooltip.style.left = `${left + 15}px`;
            tooltip.style.top = `${top + 15}px`;
            return;
          }
          tooltipIdxMap.set(u, idx);
          const time = getTimeLabel(u, idx);
          const rows = series
            .map((def, seriesIdx) => {
              const raw = u.data[seriesIdx + 1]?.[idx];
              const display =
                raw != null
                  ? def.formatValue
                    ? def.formatValue(raw as number)
                    : String(raw)
                  : '--';
              if (def.metricLabel) {
                return `<div style="margin-bottom:3px"><div style="color:${def.color};font-weight:600">${def.label}</div><div style="color:${def.color}">${def.metricLabel} = ${display}</div></div>`;
              }
              return `<div style="color:${def.color}">${def.label}: ${display}</div>`;
            })
            .join('');
          tooltip.innerHTML = `<div style="margin-bottom:4px;color:#6ee7b7">time = ${time}</div>${rows}`;
          tooltip.style.display = 'block';
          tooltip.style.left = `${left + 15}px`;
          tooltip.style.top = `${top + 15}px`;
        },
      ],
    },
    series: [
      { label: 'Time' },
      ...series.map((def) => ({
        label: def.label,
        stroke: def.color,
        width: def.strokeWidth ?? 0.7,
        ...(def.fill ? { fill: def.fill } : {}),
        ...(def.yAxis === 'right' ? { scale: 'right' } : {}),
        value: (_u: uPlot, v: number | null) =>
          v == null ? '--' : def.formatValue ? def.formatValue(v) : String(v),
      })),
    ],
    scales: {
      x: { time: false, ...(timeLabelsRef ? { distr: 2 } : {}) },
      y: { ...(leftAxis?.range ? { range: leftAxis.range } : {}) },
      ...(hasRightAxis
        ? { right: { ...(rightAxis?.range ? { range: rightAxis.range } : {}) } }
        : {}),
    },
    axes: [
      {
        stroke: '#6ee7b7',
        grid: { show: true, stroke: DEFAULT_GRID, width: 1 },
        ticks: { stroke: '#6ee7b7', size: 5, width: 1 },
        font: '10px monospace',
        size: 50,
        values: formatX
          ? (_u: uPlot, vals: number[]) => vals.map((v) => formatX(v as number))
          : (_u: uPlot, vals: number[]) => {
              const total = timeLabelsRef?.current.length ?? 0;
              const maxLabels = Math.floor(width / 60);
              const stride = Math.max(1, Math.ceil(total / maxLabels));
              return vals.map((v) => {
                const tickIdx = v as number;
                if (tickIdx % stride !== 0) return '';
                return timeLabelsRef?.current[tickIdx] ?? '';
              });
            },
      },
      {
        stroke: leftColor,
        grid: {
          show: true,
          stroke: leftAxis?.gridStroke ?? DEFAULT_GRID,
          width: 1,
        },
        ticks: { stroke: leftColor, size: 5, width: 2 },
        font: '10px monospace',
        size: leftAxis?.size ?? 80,
        values: (_u: uPlot, vals: number[]) =>
          vals.map((v) => leftFmt(v as number)),
      },
      ...(hasRightAxis
        ? [
            {
              scale: 'right',
              side: 1,
              stroke: rightColor,
              grid: { show: false },
              ticks: { stroke: rightColor, size: 5, width: 1 },
              font: '10px monospace',
              size: rightAxis?.size ?? 70,
              values: (_u: uPlot, vals: number[]) =>
                vals.map((v) => rightAxis!.formatY(v as number)),
            },
          ]
        : []),
    ],
  };
};
