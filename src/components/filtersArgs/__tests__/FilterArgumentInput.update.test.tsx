import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FilterArgumentInput } from '../FilterArgumentInput';
import { updateFilterArgument } from '@/shared/store/slices/filterArgumentSlice';

// Mock du store Redux
const createMockStore = () => configureStore({
  reducer: {
    filterArgument: (state = {}, action) => {
      if (action.type === updateFilterArgument.type) {
        return {
          ...state,
          [action.payload.filterId]: {
            ...state[action.payload.filterId],
            [action.payload.argName]: {
              status: 'pending',
              value: action.payload.argValue,
            },
          },
        };
      }
      return state;
    },
  },
});

// Mock des utils
vi.mock('@/utils/filtersArguments', () => ({
  convertArgumentValue: vi.fn((value, type) => {
    if (type === 'bool') return Boolean(value);
    if (type === 'uint') return Number(value);
    return value;
  }),
  isEnumArgument: vi.fn(() => false),
}));

describe('FilterArgumentInput - Argument Updates', () => {
  let store: ReturnType<typeof createMockStore>;
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    store = createMockStore();
    mockOnChange = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      argument: {
        name: 'testArg',
        type: 'bool' as const,
        desc: 'Test argument',
        update: true,
        update_sync: false,
      },
      value: false,
      onChange: mockOnChange,
      filterId: 'filter123',
      ...props,
    };

    return render(
      <Provider store={store}>
        <FilterArgumentInput {...defaultProps} />
      </Provider>
    );
  };

  describe('Boolean Arguments - Real-time Updates', () => {
    it('should show a switch for boolean updatable arguments', () => {
      renderComponent({
        argument: {
          name: 'fullscreen',
          type: 'bool',
          desc: 'Enable fullscreen mode',
          update: true,
          update_sync: false,
        },
        value: false,
        filterId: 'filter123',
      });

      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
      expect(switchElement).not.toBeChecked();
    });

    it('should update boolean argument immediately on switch toggle', async () => {
      renderComponent({
        argument: {
          name: 'fullscreen',
          type: 'bool',
          desc: 'Enable fullscreen mode',
          update: true,
          update_sync: false,
        },
        value: false,
        filterId: 'filter123',
      });

      const switchElement = screen.getByRole('switch');
      
      // Use userEvent for more realistic interaction or trigger the change event
      fireEvent.click(switchElement);
      
      // Wait for state updates
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(true);
      }, { timeout: 200 });

      // Should dispatch update action immediately (no debounce)
      await waitFor(() => {
        const state = store.getState();
        expect(state.filterArgument).toHaveProperty('filter123');
        expect(state.filterArgument.filter123).toHaveProperty('fullscreen');
      }, { timeout: 200 });
    });

    it('should not show switch for non-updatable boolean arguments', () => {
      renderComponent({
        argument: {
          name: 'readonly_bool',
          type: 'bool',
          desc: 'Read-only boolean',
          update: false,
          update_sync: false,
        },
        value: true,
        filterId: 'filter123',
      });

      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeDisabled();
    });

    it('should work without filterId (standalone mode)', () => {
      renderComponent({
        argument: {
          name: 'standalone_bool',
          type: 'bool',
          desc: 'Standalone boolean',
          update: true,
          update_sync: false,
        },
        value: false,
        filterId: undefined,
      });

      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
      
      fireEvent.click(switchElement);
      
      // Should only call onChange, no store update
      expect(mockOnChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Non-Boolean Arguments - Debounced Updates', () => {
    it('should show input field for string arguments', () => {
      renderComponent({
        argument: {
          name: 'output_path',
          type: 'str',
          desc: 'Output file path',
          update: true,
          update_sync: false,
        },
        value: '/tmp/output.mp4',
        filterId: 'filter123',
      });

      const inputElement = screen.getByRole('textbox');
      expect(inputElement).toBeInTheDocument();
      expect(inputElement).toHaveValue('/tmp/output.mp4');
    });

    it('should debounce string argument updates', async () => {
      vi.useFakeTimers();

      renderComponent({
        argument: {
          name: 'output_path',
          type: 'str',
          desc: 'Output file path',
          update: true,
          update_sync: false,
        },
        value: '/tmp/output.mp4',
        filterId: 'filter123',
      });

      const inputElement = screen.getByRole('textbox');
      
      // Type in the input
      fireEvent.change(inputElement, { target: { value: '/tmp/new_output.mp4' } });

      // Should not call onChange immediately
      expect(mockOnChange).not.toHaveBeenCalled();

      // Fast-forward time by 1 second (debounce delay)
      vi.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('/tmp/new_output.mp4');
      });

      vi.useRealTimers();
    });

    it('should show number input for numeric arguments', () => {
      renderComponent({
        argument: {
          name: 'bitrate',
          type: 'uint',
          desc: 'Video bitrate',
          update: true,
          update_sync: false,
        },
        value: 1000000,
        filterId: 'filter123',
      });

      const inputElement = screen.getByRole('spinbutton');
      expect(inputElement).toBeInTheDocument();
      expect(inputElement).toHaveValue(1000000);
    });
  });

  describe('Error Handling', () => {
    it('should handle conversion errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock convertArgumentValue to throw an error
      const { convertArgumentValue } = await import('@/utils/filtersArguments');
      vi.mocked(convertArgumentValue).mockImplementation(() => {
        throw new Error('Invalid value');
      });

      renderComponent({
        argument: {
          name: 'problematic_arg',
          type: 'bool',
          desc: 'Problematic argument',
          update: true,
          update_sync: false,
        },
        value: false,
        filterId: 'filter123',
      });

      const switchElement = screen.getByRole('switch');
      fireEvent.click(switchElement);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error in immediate update:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Integration with FilterArgumentsDialog', () => {
    it('should support filterId being passed conditionally for boolean args', () => {
      // Test when filterId is passed (boolean args)
      const { rerender } = renderComponent({
        argument: {
          name: 'fullscreen',
          type: 'bool',
          desc: 'Enable fullscreen',
          update: true,
          update_sync: false,
        },
        value: false,
        filterId: 'filter123',
      });

      let switchElement = screen.getByRole('switch');
      fireEvent.click(switchElement);
      expect(mockOnChange).toHaveBeenCalledWith(true);

      // Reset mock
      mockOnChange.mockClear();

      // Test when filterId is not passed (non-boolean args)
      rerender(
        <Provider store={store}>
          <FilterArgumentInput
            argument={{
              name: 'output_path',
              type: 'str',
              desc: 'Output path',
              update: true,
              update_sync: false,
            }}
            value="/tmp/test.mp4"
            onChange={mockOnChange}
            filterId={undefined}
          />
        </Provider>
      );

      const inputElement = screen.getByRole('textbox');
      expect(inputElement).toBeInTheDocument();
    });
  });
});