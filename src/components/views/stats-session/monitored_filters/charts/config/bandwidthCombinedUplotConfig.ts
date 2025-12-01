import uPlot from 'uplot';
import React from 'react';
import { formatBitrate } from '@/utils/formatting/numbers';

export interface BandwidthCombinedConfigParams {
  timeLabelsRef: React.MutableRefObject<string[]>;
  width?: number;
  height?: number;
}

export const createBandwidthCombinedConfig = ({
  timeLabelsRef,
  width = 400,
  height = 180,
}: BandwidthCombinedConfigParams): uPlot.Options => {
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
            return;
          }

          const lastIdx = (u as any)._lastTooltipIdx as number | null;

          // If we're on the same point, just update the position, not the content
          if (lastIdx === idx) {
            tooltip.style.left = `${left + 15}px`;
            tooltip.style.top = `${top + 15}px`;
            return;
          }

          // Store the new index
          (u as any)._lastTooltipIdx = idx;

          const time = timeLabelsRef.current[idx] || '--';
          const upload = u.data[1][idx]
            ? formatBitrate(u.data[1][idx] * 8)
            : '--';
          const download = u.data[2][idx]
            ? formatBitrate(u.data[2][idx] * 8)
            : '--';

          tooltip.innerHTML = `
      <div style="margin-bottom: 4px; color: #6ee7b7;">Time: ${time}</div>
      <div style="color: #10b981;">Upload: ${upload}</div>
      <div style="color: #3b82f6;">Download: ${download}</div>
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
        label: 'Upload',
        stroke: '#10b981',
        width: 0.7,

        value: (_u, v) => (v == null ? '--' : formatBitrate(v * 8)),
      },
      {
        label: 'Download',
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
        stroke: '#6ee7b7',
        grid: { show: true, stroke: 'rgba(110, 231, 183, 0.1)', width: 1 },
        ticks: { stroke: '#6ee7b7', size: 5, width: 1 },
        font: '10px monospace',
        size: 50,
        values: (_u, vals) =>
          vals.map((v) => {
            const idx = v as number;
            return timeLabelsRef.current[idx] || '';
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
