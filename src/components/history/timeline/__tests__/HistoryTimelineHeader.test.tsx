import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HistoryTimelineHeader from '../HistoryTimelineHeader';

describe('HistoryTimelineHeader', () => {
  it('renders title, current time and filter counts', () => {
    render(
      <HistoryTimelineHeader
        title="Timeline"
        activeFilter="all"
        onFilterChange={vi.fn()}
        counts={{ all: 12, error: 3 }}
        currentTimeLabel="00:01:23"
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
      />,
    );

    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.getByText('00:01:23')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('calls onFilterChange when a chip is clicked', async () => {
    const onFilterChange = vi.fn();
    render(
      <HistoryTimelineHeader
        title="Timeline"
        activeFilter="all"
        onFilterChange={onFilterChange}
        counts={{}}
        currentTimeLabel="00:00:00"
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByText('Errors'));
    expect(onFilterChange).toHaveBeenCalledWith('error');
  });

  it('disables zoom buttons per canZoomIn/canZoomOut', () => {
    render(
      <HistoryTimelineHeader
        title="Timeline"
        activeFilter="all"
        onFilterChange={vi.fn()}
        counts={{}}
        currentTimeLabel="00:00:00"
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        canZoomIn={false}
        canZoomOut={false}
      />,
    );

    expect(screen.getByLabelText('Zoom in')).toBeDisabled();
    expect(screen.getByLabelText('Zoom out')).toBeDisabled();
  });
});
