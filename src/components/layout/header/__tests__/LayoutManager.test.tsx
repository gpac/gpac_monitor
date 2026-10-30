import { describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { createWidgetInstance } from '@/components/widget/registry';
import widgetsReducer, {
  updateWidgetPosition,
} from '@/shared/store/widgets/widgetsSlice';
import { LayoutManager } from '../LayoutManager';

describe('LayoutManager presets', () => {
  it('customizes a default and returns to the supplied version without losing other saves', () => {
    window.localStorage.clear();
    vi.mocked(createWidgetInstance).mockImplementation((type) => ({
      id: type,
      type,
      title: type,
      x: 0,
      y: 0,
      w: 6,
      h: 4,
    }));
    const store = configureStore({
      reducer: { widgets: widgetsReducer },
      preloadedState: {
        widgets: {
          activeWidgets: [],
          configs: {},
          savedLayouts: {},
          viewByFilter: {},
        },
      },
    });
    render(
      <Provider store={store}>
        <LayoutManager />
      </Provider>,
    );
    const presetRow = screen.getByText('Preview').parentElement!;
    fireEvent.click(within(presetRow).getByRole('button', { name: 'Load' }));
    const nameInput = screen.getByPlaceholderText('Layout name');
    expect(nameInput).toHaveValue('Preview');
    const widget = store.getState().widgets.activeWidgets[0];
    store.dispatch(updateWidgetPosition({ id: widget.id, h: 12 }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Preview (customized)')).toBeInTheDocument();
    expect(
      JSON.parse(window.localStorage.getItem('gpac_monitor_layout_v1')!).Preview
        .widgets[0].h,
    ).toBe(12);
    fireEvent.change(nameInput, { target: { value: 'Personal' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const savedRow = screen.getByText('Preview').parentElement!;
    fireEvent.click(within(savedRow).getByRole('button', { name: 'Delete' }));
    fireEvent.click(within(presetRow).getByRole('button', { name: 'Load' }));
    expect(store.getState().widgets.activeWidgets[0].h).toBe(6);
    expect(store.getState().widgets.savedLayouts.Personal.widgets[0].h).toBe(
      12,
    );
  });
});
