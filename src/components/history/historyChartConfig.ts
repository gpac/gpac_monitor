import uPlot from 'uplot';

export function createHistoryChartOptions(): uPlot.Options {
  return {
    width: 800,
    height: 300,
    scales: { x: { time: false }, y: {} },
    axes: [
      {
        stroke: '#666',
        grid: { stroke: '#333', width: 1 },
        label: 'Time (s)',
        labelSize: 14,
      },
      {
        stroke: '#666',
        grid: { stroke: '#333', width: 1 },
        size: 70,
      },
    ],
    series: [
      {},
      {
        label: 'Graph Version',
        stroke: '#6b7280',
        width: 2,
        scale: 'graphV'
      },
      {
        label: 'Bytes Done',
        stroke: '#3b82f6',
        width: 2,
        fill: 'rgba(59,130,246,0.1)',
      },
      {
        label: 'Bytes Sent',
        stroke: '#8b5cf6',
        width: 2,
      },
      {
        label: 'Pck Done',
        stroke: '#10b981',
        width: 2,
        scale: 'pck',
      },
      {
        label: 'Pck Sent',
        stroke: '#f59e0b',
        width: 2,
        scale: 'pck',
      },
      {
        label: 'Errors',
        stroke: '#ef4444',
        width: 2,
        scale: 'pck',
      },
    ],
  };
}
