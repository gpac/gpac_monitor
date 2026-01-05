import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentType } from 'react';
import { LogShortcutButton } from '../LogShortcutButton';

const TestIcon: ComponentType<{ className?: string }> = () => (
  <svg data-testid="icon" />
);

describe('LogShortcutButton', () => {
  it('renders icon and count when count is provided', () => {
    render(
      <LogShortcutButton
        icon={TestIcon}
        title="Errors"
        count={3}
        colorClass="text-danger"
        onClick={() => {}}
      />,
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('is disabled when count is 0', () => {
    render(
      <LogShortcutButton
        icon={TestIcon}
        title="Errors"
        count={0}
        colorClass="text-danger"
        onClick={() => {}}
      />,
    );

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(
      <LogShortcutButton
        icon={TestIcon}
        title="Errors"
        count={2}
        colorClass="text-danger"
        onClick={onClick}
      />,
    );

    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not rerender when count and disabled are unchanged', () => {
    const TrackingIcon = vi.fn(() => <svg data-testid="icon" />);
    const { rerender } = render(
      <LogShortcutButton
        icon={TrackingIcon as unknown as ComponentType<{ className?: string }>}
        title="Errors"
        count={2}
        colorClass="text-danger"
        onClick={() => {}}
      />,
    );

    expect(TrackingIcon).toHaveBeenCalledTimes(1);

    rerender(
      <LogShortcutButton
        icon={TrackingIcon as unknown as ComponentType<{ className?: string }>}
        title="Errors"
        count={2}
        colorClass="text-danger"
        onClick={() => {}}
      />,
    );

    expect(TrackingIcon).toHaveBeenCalledTimes(1);
  });
});
