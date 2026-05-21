import uPlot from 'uplot';
import React from 'react';
import { formatBitrate } from '@/utils/formatting/numbers';

const tooltipIdxMap = new WeakMap<uPlot, number | null>();

export interface BandwidthCombinedConfigParams {
  timeLabelsRef: React.MutableRefObject<string[]>;
  width?: number;
  height?: number;
  isHistory?: boolean;
}

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

          //  if idx is null during a refresh, don't change anything
          if (idx == null) {
            tooltip.style.display = 'none';
            return;
          }

          const lastIdx = tooltipIdxMap.get(u) ?? null;

          // If we're on the same point, just update the position, not the content
          if (lastIdx === idx) {
            tooltip.style.left = `${left + 15}px`;
            tooltip.style.top = `${top + 15}px`;
            return;
          }

          // Store the new index
          tooltipIdxMap.set(u, idx);

          const time = timeLabelsRef.current[idx] || '--';
          const outband = u.data[1][idx]
            ? formatBitrate(u.data[1][idx] * 8)
            : '--';
          const inband = u.data[2][idx]
            ? formatBitrate(u.data[2][idx] * 8)
            : '--';

          tooltip.innerHTML = `
      <div style="margin-bottom: 4px; color: #6ee7b7;">${timeLabel}: ${time}</div>
      <div style="color: #10b981;">Outband: ${outband}</div>
      <div style="color: #3b82f6;">Inband: ${inband}</div>
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
    ],
    scales: {
      x: { time: false, distr: 2 },
      y: {},
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
            // In live mode, strip hours prefix (HH:MM:SS → MM:SS)
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
    ],
  };
};
