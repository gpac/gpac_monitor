import uPlot from 'uplot';
import { formatBytes } from '@/utils/formatting';

export interface BandwidthUplotConfigParams {
  type: 'sent' | 'received';
  bandwidthData: number[];
  timeLabels: string[];
}

const BANDWIDTH_COLORS = {
  sent: '#10b981',
  received: '#3b82f6',
} as const;

export const createBandwidthUplotConfig = ({
  type,
  bandwidthData,
  timeLabels,
}: BandwidthUplotConfigParams): uPlot.Options => {
  const color = BANDWIDTH_COLORS[type];

  return {
    width: 400,
    height: 150,
    padding: [10, 10, 5, 5],
    cursor: {
      show: true,
      drag: { x: false, y: false },
      points: {
        size: 6,
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

          if (idx === null || idx === undefined) {
            const tooltip = u.root.querySelector('.u-tooltip');
            if (tooltip) (tooltip as HTMLElement).style.display = 'none';
            return;
          }

          let tooltip = u.root.querySelector('.u-tooltip') as HTMLElement;
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

          const time = timeLabels[idx] || '--';
          const bandwidth = bandwidthData[idx]
            ? `${formatBytes(bandwidthData[idx])}/s`
            : '--';

          tooltip.innerHTML = `
            <div style="margin-bottom: 4px; color: #6ee7b7;">Time: ${time}</div>
            <div style="color: ${color};">Bandwidth: ${bandwidth}</div>
          `;

          tooltip.style.display = 'block';
          tooltip.style.left = `${left + 185}px`;
          tooltip.style.top = `${top + 80}px`;
        },
      ],
    },
    series: [
      { label: 'Time' },
      {
        label: 'Bandwidth',
        stroke: color,
        width: 2,
        fill: `${color}20`,
        value: (_u, v) => (v == null ? '--' : `${formatBytes(v)}/s`),
      },
    ],
    scales: {
      x: { time: false },
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
            const idx = Math.round(v);
            return timeLabels[idx] || '';
          }),
      },
      {
        stroke: color,
        grid: { show: true, stroke: `${color}20`, width: 1 },
        ticks: { stroke: color, size: 5, width: 2 },
        font: '10px monospace',
        size: 80,
        values: (_u, vals) => vals.map((v) => `${formatBytes(v)}/s`),
      },
    ],
  };
};
