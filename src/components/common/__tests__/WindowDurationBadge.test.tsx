import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WindowDurationBadge } from '../WindowDurationBadge';
import type { ChartDuration } from '@/utils/charts';

describe('WindowDurationBadge', () => {
  it('renders the current duration label', () => {
    render(<WindowDurationBadge value="10min" onChange={() => {}} />);
    expect(screen.getByText('10m')).toBeInTheDocument();
  });

  it('opens dropdown with all durations by default', async () => {
    const user = userEvent.setup();
    render(<WindowDurationBadge value="1min" onChange={() => {}} />);
    await user.click(screen.getByRole('button'));

    expect(await screen.findByText('20 seconds')).toBeInTheDocument();
    expect(screen.getByText('1 minute')).toBeInTheDocument();
    expect(screen.getByText('5 minutes')).toBeInTheDocument();
    expect(screen.getByText('10 minutes')).toBeInTheDocument();
    expect(screen.getByText('Unlimited')).toBeInTheDocument();
  });

  it('filters options when options prop is provided', async () => {
    const user = userEvent.setup();
    const options: ChartDuration[] = ['20s', '1min', '5min', '10min'];
    render(
      <WindowDurationBadge
        value="1min"
        onChange={() => {}}
        options={options}
      />,
    );
    await user.click(screen.getByRole('button'));

    expect(await screen.findByText('20 seconds')).toBeInTheDocument();
    expect(screen.getByText('10 minutes')).toBeInTheDocument();
    expect(screen.queryByText('Unlimited')).not.toBeInTheDocument();
  });

  it('invokes onChange when a duration is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<WindowDurationBadge value="1min" onChange={onChange} />);
    await user.click(screen.getByRole('button'));
    await user.click(await screen.findByText('5 minutes'));

    expect(onChange).toHaveBeenCalledWith('5min');
  });
});
