import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SeekBar from '../SeekBar';

vi.mock('@radix-ui/react-slider', () => ({
  Root: ({
    onValueChange,
    onValueCommit,
    value,
    children,
    className,
  }: {
    onValueChange: (value: number[]) => void;
    onValueCommit: (value: number[]) => void;
    value: number[];
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="slider-root" data-value={value[0]} className={className}>
      <button onClick={() => onValueChange([77.41])}>simulate-change</button>
      <button onClick={() => onValueCommit([77.41])}>simulate-commit</button>
      {children}
    </div>
  ),
  Track: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Range: () => <div />,
  Thumb: () => <div />,
}));

describe('SeekBar', () => {
  describe('regression', () => {
    it('does not snap back to progressPercent between onValueCommit and prop update', async () => {
      const user = userEvent.setup();
      const onSeekPositionChange = vi.fn();

      const { rerender } = render(
        <SeekBar
          progressPercent={37.24}
          onSeekPositionChange={onSeekPositionChange}
          formatTooltip={() => ''}
        />,
      );

      const slider = screen.getByTestId('slider-root');
      expect(parseFloat(slider.getAttribute('data-value')!)).toBeCloseTo(37.24);

      await user.click(screen.getByText('simulate-change'));
      await user.click(screen.getByText('simulate-commit'));

      expect(onSeekPositionChange).toHaveBeenCalledWith(77.41);
      expect(parseFloat(slider.getAttribute('data-value')!)).toBeCloseTo(
        77.41,
        1,
      );

      rerender(
        <SeekBar
          progressPercent={77.41}
          onSeekPositionChange={onSeekPositionChange}
          formatTooltip={() => ''}
        />,
      );

      expect(parseFloat(slider.getAttribute('data-value')!)).toBeCloseTo(
        77.41,
        1,
      );
    });
  });
});
