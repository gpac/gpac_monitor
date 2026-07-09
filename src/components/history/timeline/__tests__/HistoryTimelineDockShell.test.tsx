import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import HistoryTimelineDockShell from '../HistoryTimelineDockShell';

vi.mock('react-resizable', () => ({
  Resizable: ({
    children,
    handle,
  }: {
    children: React.ReactElement;
    handle: (
      axis: string,
      ref: React.Ref<HTMLDivElement>,
    ) => React.ReactElement;
  }) => (
    <>
      {children}
      {handle('n', { current: null })}
    </>
  ),
}));

describe('HistoryTimelineDockShell', () => {
  it('uses inline position:absolute, not Tailwind class, to survive react-resizable CSS override', () => {
    const { container } = render(
      <HistoryTimelineDockShell
        dockHeight={80}
        maxDockHeight={400}
        onResize={vi.fn()}
      />,
    );

    const dockDiv = container.querySelector(
      '[style*="position: absolute"], [style*="position:absolute"]',
    );

    expect(dockDiv).not.toBeNull();
    expect(dockDiv!.classList.contains('absolute')).toBe(false);
  });

  it('renders only the zones provided as props', () => {
    const { container } = render(
      <HistoryTimelineDockShell
        dockHeight={80}
        maxDockHeight={400}
        onResize={vi.fn()}
        header={<div data-testid="header">header</div>}
      />,
    );

    expect(container.querySelector('[data-testid="header"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="timeline"]')).toBeNull();
    expect(container.querySelector('[data-testid="detail"]')).toBeNull();
    expect(container.querySelector('[data-testid="minimap"]')).toBeNull();
  });

  it('renders all four zones when all are provided', () => {
    const { container } = render(
      <HistoryTimelineDockShell
        dockHeight={80}
        maxDockHeight={400}
        onResize={vi.fn()}
        header={<div data-testid="header">header</div>}
        timeline={<div data-testid="timeline">timeline</div>}
        detail={<div data-testid="detail">detail</div>}
        minimap={<div data-testid="minimap">minimap</div>}
      />,
    );

    expect(container.querySelector('[data-testid="header"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="timeline"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="detail"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="minimap"]')).not.toBeNull();
  });
});
