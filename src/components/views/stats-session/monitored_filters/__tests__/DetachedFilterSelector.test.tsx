import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { filtersUpdated } from '@/shared/store/actions/globalActions';
import { toggleSelectedPid } from '@/shared/store/slices/monitoredFilterSlice';
import { removeWidget } from '@/shared/store/widgets/widgetsSlice';
import {
  openSelector,
  renderSelector,
  sessionFilters,
} from './detachedFilterTestStore';

describe('DetachedFilterSelector', () => {
  it('lists all session filters and disables those already detached elsewhere', async () => {
    const store = renderSelector();
    const occupied = await screen.findByRole('menuitem', {
      name: /vdec.*Detached elsewhere/,
    });
    expect(occupied).toHaveAttribute('aria-disabled', 'true');
    expect(
      screen.getByRole('menuitem', { name: /mp4dmx.*Current/ }),
    ).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(occupied);
    expect(store.getState().widgets.viewByFilter[3]?.mode).toBe('detached');
  });

  it('replaces the panel content and reattaches the previous filter on selection', async () => {
    const store = renderSelector();
    fireEvent.click(await screen.findByRole('menuitem', { name: /vout/ }));
    expect(store.getState().widgets.activeWidgets[0]).toMatchObject({
      id: 'panel',
      detachedFilterIdx: 0,
      title: 'vout',
      x: 0,
      y: 0,
      w: 8,
      h: 6,
    });
    expect(store.getState().widgets.viewByFilter[3]).toEqual({
      mode: 'inline',
    });
    expect(store.getState().widgets.viewByFilter[0]).toEqual({
      mode: 'detached',
      widgetId: 'panel',
    });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

describe('detached filter removal', () => {
  it('removes a deleted filter from an open selector and cleans its detached panel', async () => {
    const store = renderSelector();
    await screen.findByRole('menuitem', { name: /vdec/ });
    act(() =>
      store.dispatch(
        filtersUpdated(sessionFilters.filter((filter) => filter.idx !== 7)),
      ),
    );
    expect(
      screen.queryByRole('menuitem', { name: /vdec/ }),
    ).not.toBeInTheDocument();
    expect(store.getState().widgets.viewByFilter[7]).toBeUndefined();
    expect(store.getState().widgets.configs.other).toBeUndefined();
    expect(
      store.getState().widgets.activeWidgets.map((widget) => widget.id),
    ).toEqual(['panel']);
  });

  it('makes a filter selectable when its other detached panel is closed', async () => {
    const store = renderSelector();
    await screen.findByRole('menuitem', { name: /vdec/ });
    act(() => store.dispatch(removeWidget('other')));
    const releasedFilter = screen.getByRole('menuitem', { name: /vdec/ });
    expect(releasedFilter).not.toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(releasedFilter);
    expect(store.getState().widgets.viewByFilter[7]).toEqual({
      mode: 'detached',
      widgetId: 'panel',
    });
    expect(
      screen.getByRole('button', { name: 'Change detached filter' }),
    ).toHaveTextContent('vdec');
  });

  it('keeps the replacement panel when the previous filter is deleted', async () => {
    const store = renderSelector();
    fireEvent.click(await screen.findByRole('menuitem', { name: /vout/ }));
    act(() => {
      store.dispatch(
        toggleSelectedPid({ filterIdx: 3, direction: 'output', pidIndex: 0 }),
      );
      store.dispatch(
        toggleSelectedPid({ filterIdx: 0, direction: 'input', pidIndex: 0 }),
      );
      store.dispatch(
        filtersUpdated(sessionFilters.filter((filter) => filter.idx !== 3)),
      );
    });
    expect(store.getState().monitoredFilter.selectedPidTargets).toMatchObject([
      { filterIdx: 0, direction: 'input', pidIndex: 0 },
    ]);
    expect(store.getState().widgets.viewByFilter[3]).toBeUndefined();
    expect(store.getState().widgets.activeWidgets[0]).toMatchObject({
      id: 'panel',
      detachedFilterIdx: 0,
    });
    openSelector();
    expect(
      await screen.findByRole('menuitem', { name: /vout.*Current/ }),
    ).toHaveAttribute('aria-disabled', 'true');
    expect(
      screen.queryByRole('menuitem', { name: /mp4dmx/ }),
    ).not.toBeInTheDocument();
  });

  it('unmounts the replacement panel when its current filter is deleted', async () => {
    const store = renderSelector();
    fireEvent.click(await screen.findByRole('menuitem', { name: /vout/ }));
    openSelector();
    await screen.findByRole('menuitem', { name: /vout/ });
    act(() =>
      store.dispatch(
        filtersUpdated(sessionFilters.filter((filter) => filter.idx !== 0)),
      ),
    );
    expect(
      screen.queryByRole('button', { name: 'Change detached filter' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(store.getState().widgets.viewByFilter[0]).toBeUndefined();
    expect(store.getState().widgets.viewByFilter[3]).toEqual({
      mode: 'inline',
    });
    expect(store.getState().widgets.configs.panel).toBeUndefined();
    expect(
      store.getState().widgets.activeWidgets.map((widget) => widget.id),
    ).toEqual(['other']);
  });

  it('cleans all panels when the session filter list becomes empty', () => {
    const store = renderSelector();
    act(() => store.dispatch(filtersUpdated([])));
    expect(store.getState().widgets.activeWidgets).toEqual([]);
    expect(store.getState().widgets.viewByFilter).toEqual({});
    expect(store.getState().widgets.configs).toEqual({});
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
