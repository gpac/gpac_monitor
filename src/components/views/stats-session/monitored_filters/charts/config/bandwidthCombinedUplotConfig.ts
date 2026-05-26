import type React from 'react';
import uPlot from 'uplot';
import { formatBitrate } from '@/utils/formatting/numbers';
import { formatMicroseconds } from '@/utils/formatting/time';

export interface BandwidthCombinedConfigParams {
  timeLabelsRef: React.MutableRefObject<string[]>;
  width?: number;
  height?: number;
  isHistory?: boolean;
}

const tooltipIdxMap = new WeakMap<uPlot, number | null>();

export const createBandwidthCombinedConfig = ({
  timeLabelsRef,
  width = 400,
  height = 180,
  isHistory = false,
}: BandwidthCombinedConfigParams): uPlot.Options => {
  const timeLabel = isHistory ? 'Session time' : 'Time';
  return {
    width,
    height,
    padding: [10, 10, 5, 5],
    cursor: {
      show: true,
      drag: { x: false, y: false },
      points: {
        size: 8,
        width: 2,
      },
    },
    legend: {
      show: false,
    },
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
            tooltip.style.cssText = `
        position: absolute;
        background: rgb(2 6 23);
        color: rgb(226 232 240);
        border: 1px solid hsl(var(--border));
        border-radius: 6px;
        padding: 8px 10px;
        font-size: 11px;
        font-family: monospace;
        pointer-events: none;
        z-index: 100;
        white-space: nowrap;
      `;
            u.root.appendChild(tooltip);
          }

          if (!tooltip) return;

          if (idx == null) {
            tooltip.style.display = 'none';
            return;
          }

          const lastIdx = tooltipIdxMap.get(u) ?? null;

          if (lastIdx === idx) {
            tooltip.style.left = `${left + 15}px`;
            tooltip.style.top = `${top + 15}px`;
            return;
          }

          tooltipIdxMap.set(u, idx);

          const time = timeLabelsRef.current[idx] || '--';
          const outband = u.data[1][idx]
            ? formatBitrate(u.data[1][idx] * 8)
            : '--';
          const inband = u.data[2][idx]
            ? formatBitrate(u.data[2][idx] * 8)
            : '--';
          const procTime = u.data[3]?.[idx] != null
            ? formatMicroseconds(u.data[3][idx])
            : '--';

          tooltip.innerHTML = `
      <div style="margin-bottom: 4px; color: #6ee7b7;">${timeLabel}: ${time}</div>
      <div style="color: #10b981;">Outband: ${outband}</div>
      <div style="color: #3b82f6;">Inband: ${inband}</div>
      <div style="color: #f59e0b;">Filter Proc. Time: ${procTime}</div>
    `;

          tooltip.style.display = 'block';
          tooltip.style.left = `${left + 15}px`;
          tooltip.style.top = `${top + 15}px`;
        },
      ],
    },
    series: [
      { label: 'Time' },
      {
        label: 'Outband',
        stroke: '#10b981',
        width: 0.7,
        value: (_u, v) => (v == null ? '--' : formatBitrate(v * 8)),
      },
      {
        label: 'Inband',
        stroke: '#3b82f6',
        width: 0.7,
        value: (_u, v) => (v == null ? '--' : formatBitrate(v * 8)),
      },
      {
        label: 'Filter Proc. Time',
        stroke: '#f59e0b',
        width: 0.7,
        scale: 'proctime',
        value: (_u, v) => (v == null ? '--' : formatMicroseconds(v)),
      },
    ],
    scales: {
      x: { time: false, distr: 2 },
      y: {},
      proctime: {},
    },
    axes: [
      {
        label: timeLabel,
        stroke: '#6ee7b7',
        grid: { show: true, stroke: 'rgba(110, 231, 183, 0.1)', width: 1 },
        ticks: { stroke: '#6ee7b7', size: 5, width: 1 },
        font: '10px monospace',
        size: 50,
        values: (_u, vals) =>
          vals.map((v) => {
            const label = timeLabelsRef.current[v as number] || '';
            return !isHistory && label.includes(':')
              ? label.slice(label.indexOf(':') + 1)
              : label;
          }),
      },
      {
        stroke: '#6ee7b7',
        grid: { show: true, stroke: 'rgba(110, 231, 183, 0.1)', width: 1 },
        ticks: { stroke: '#6ee7b7', size: 5, width: 2 },
        font: '10px monospace',
        size: 80,
        values: (_u, vals) => vals.map((v) => formatBitrate(v * 8)),
      },
      {
        scale: 'proctime',
        stroke: '#f59e0b',
        side: 1,
        grid: { show: false },
        ticks: { stroke: '#f59e0b', size: 5, width: 1 },
        font: '10px monospace',
        size: 70,
        values: (_u, vals) => vals.map((v) => formatMicroseconds(v)),
      },
    ],
  };
};
