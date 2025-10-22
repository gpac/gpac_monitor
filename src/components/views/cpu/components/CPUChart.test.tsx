import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CPUChart } from './CPUChart';

// Mock the Chart component
vi.mock('@/components/common/Chart', () => ({
  Chart: ({ config, currentValue, isLive }: any) => (
    <div data-testid="chart-mock">
      <div data-testid="chart-title">{config.title}</div>
      <div data-testid="chart-value">{currentValue}</div>
      <div data-testid="chart-live">{isLive ? 'live' : 'paused'}</div>
      <div data-testid="chart-areas">{config.areas.length}</div>
    </div>
  ),
}));

describe('CPUChart', () => {
  it('should render with correct title', () => {
    render(<CPUChart currentCPUPercent={50} isLive={true} />);

    expect(screen.getByTestId('chart-title')).toHaveTextContent('CPU Usage');
  });

  it('should pass current CPU value to Chart', () => {
    render(<CPUChart currentCPUPercent={75.5} isLive={true} />);

    expect(screen.getByTestId('chart-value')).toHaveTextContent('75.5');
  });

  it('should render single area (CPU only)', () => {
    render(<CPUChart currentCPUPercent={50} isLive={true} />);

    expect(screen.getByTestId('chart-areas')).toHaveTextContent('1');
  });

  it('should reflect live state', () => {
    const { rerender } = render(
      <CPUChart currentCPUPercent={50} isLive={true} />,
    );

    expect(screen.getByTestId('chart-live')).toHaveTextContent('live');

    rerender(<CPUChart currentCPUPercent={50} isLive={false} />);

    expect(screen.getByTestId('chart-live')).toHaveTextContent('paused');
  });

  it('should handle zero CPU value', () => {
    render(<CPUChart currentCPUPercent={0} isLive={true} />);

    expect(screen.getByTestId('chart-value')).toHaveTextContent('0');
  });
});
