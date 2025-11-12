import uPlot from 'uplot';
import { formatBytes } from '@/utils/formatting';

export interface BandwidthCombinedConfigParams {
  uploadData: number[];
  downloadData: number[];
  timeLabels: string[];
  width?: number;
  height?: number;
}

export const createBandwidthCombinedConfig = ({
  uploadData,
  downloadData,
  timeLabels,
  width = 400,
  height = 200,
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
          const upload = uploadData[idx]
            ? `${formatBytes(uploadData[idx])}/s`
            : '--';
          const download = downloadData[idx]
            ? `${formatBytes(downloadData[idx])}/s`
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
        width: 2,
        fill: 'rgba(16, 185, 129, 0.15)',
        value: (_u, v) => (v == null ? '--' : `${formatBytes(v)}/s`),
      },
      {
        label: 'Download',
        stroke: '#3b82f6',
        width: 2,
        fill: 'rgba(59, 130, 246, 0.15)',
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
        stroke: '#6ee7b7',
        grid: { show: true, stroke: 'rgba(110, 231, 183, 0.1)', width: 1 },
        ticks: { stroke: '#6ee7b7', size: 5, width: 2 },
        font: '10px monospace',
        size: 80,
        values: (_u, vals) => vals.map((v) => `${formatBytes(v)}/s`),
      },
    ],
  };
};
