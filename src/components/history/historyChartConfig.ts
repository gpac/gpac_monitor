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
        label: 'Time (µs)',
        labelSize: 14,
      },
      {
        stroke: '#666',
        grid: { stroke: '#333', width: 1 },
        size: 60,
      },
    ],
    series: [
      {},
      {
        label: 'Bytes Done',
        stroke: '#3b82f6',
        width: 2,
        fill: 'rgba(59,130,246,0.1)',
      },
      {
        label: 'Packets Sent',
        stroke: '#10b981',
        width: 2,
      },
    ],
  };
}
