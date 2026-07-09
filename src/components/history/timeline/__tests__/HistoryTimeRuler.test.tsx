import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import HistoryTimeRuler from '../HistoryTimeRuler';
import type { TimeRuler } from '@/utils/history/generateTimeTicks';
import type { TimelinePlayhead } from '../timelineViewModel.types';

const rulerTicks: TimeRuler = {
  major: [
    { positionPercent: 0, label: '00:00' },
    { positionPercent: 50, label: '00:30' },
    { positionPercent: 100, label: '01:00' },
  ],
  minor: [{ positionPercent: 25 }, { positionPercent: 75 }],
};

describe('HistoryTimeRuler', () => {
  it('renders tick labels', () => {
    const playhead: TimelinePlayhead = {
      positionPercent: 20,
      sessionTimeUs: 12_000_000,
      label: '00:12',
    };

    const { getByText } = render(
      <HistoryTimeRuler rulerTicks={rulerTicks} playhead={playhead} />,
    );

    expect(getByText('00:00')).toBeInTheDocument();
    expect(getByText('00:30')).toBeInTheDocument();
    expect(getByText('01:00')).toBeInTheDocument();
  });

  it('positions the playhead line and capsule at positionPercent', () => {
    const playhead: TimelinePlayhead = {
      positionPercent: 42,
      sessionTimeUs: 12_000_000,
      label: '00:12',
    };

    const { container, getByText } = render(
      <HistoryTimeRuler rulerTicks={rulerTicks} playhead={playhead} />,
    );

    const line = container.querySelector('.bg-history.w-px');
    expect(line).toHaveStyle({ left: '42%' });
    expect(getByText('00:12')).toBeInTheDocument();
  });

  it('hides the playhead when positionPercent is outside the visible window', () => {
    const playhead: TimelinePlayhead = {
      positionPercent: -10,
      sessionTimeUs: -5_000_000,
      label: '-00:05',
    };

    const { container, queryByText } = render(
      <HistoryTimeRuler rulerTicks={rulerTicks} playhead={playhead} />,
    );

    expect(container.querySelector('.bg-history.w-px')).toBeNull();
    expect(queryByText('-00:05')).toBeNull();
  });
});
