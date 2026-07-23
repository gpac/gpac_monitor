import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HistoryTimelineLanes from '../HistoryTimelineLanes';
import type { TimelineLaneView } from '../timelineViewModel.types';
import type { TimelineEvent } from '@/services/historyService/types';

const errorEvent: TimelineEvent = {
  id: 'error-1',
  sessionTimeUs: 3_350_000,
  type: 'error',
  title: 'decode error',
};

const lanes: TimelineLaneView[] = [
  {
    id: 'errors',
    label: 'Errors',
    items: [{ kind: 'event', event: errorEvent, positionPercent: 33.5 }],
  },
  { id: 'graph', label: 'Graph', items: [] },
  {
    id: 'config',
    label: 'Config',
    items: [
      {
        kind: 'cluster',
        count: 2,
        fromUs: 50_000_000,
        toUs: 52_000_000,
        positionPercent: 51,
      },
    ],
  },
];

describe('HistoryTimelineLanes', () => {
  it('renders the three lane labels', () => {
    render(
      <HistoryTimelineLanes
        lanes={lanes}
        playheadPercent={0}
        onSeek={vi.fn()}
      />,
    );
    expect(screen.getByText('Errors')).toBeInTheDocument();
    expect(screen.getByText('Graph')).toBeInTheDocument();
    expect(screen.getByText('Config')).toBeInTheDocument();
  });

  it('positions each dot at its positionPercent, same frame as the ruler', () => {
    render(
      <HistoryTimelineLanes
        lanes={lanes}
        playheadPercent={0}
        onSeek={vi.fn()}
      />,
    );
    const dots = screen.getAllByRole('button');
    expect(dots).toHaveLength(2);
    expect(dots[0].style.left).toBe('33.5%');
    expect(dots[1].style.left).toBe('51%');
  });

  it('seeks to the event sessionTimeUs on dot click, cluster seeks to fromUs', async () => {
    const user = userEvent.setup();
    const onSeek = vi.fn();
    render(
      <HistoryTimelineLanes
        lanes={lanes}
        playheadPercent={0}
        onSeek={onSeek}
      />,
    );
    const dots = screen.getAllByRole('button');
    await user.click(dots[0]);
    expect(onSeek).toHaveBeenCalledWith(3_350_000);
    await user.click(dots[1]);
    expect(onSeek).toHaveBeenCalledWith(50_000_000);
  });
});
