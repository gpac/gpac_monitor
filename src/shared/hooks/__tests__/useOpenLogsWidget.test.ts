import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore, AnyAction } from '@reduxjs/toolkit';
import logsReducer from '@/shared/store/slices/logsSlice';
import { useOpenLogsWidget } from '../useOpenLogsWidget';
import { Widget, WidgetType } from '@/types/ui/widget';
import { GpacLogLevel } from '@/types/domain/gpac/log-types';

vi.mock('@/shared/store/slices/widgetsSlice', () => ({
  addWidget: (type: WidgetType) => ({
    type: 'widgets/addWidget',
    payload: type,
  }),
}));

type WidgetsState = {
  activeWidgets: Widget[];
};

const createWidgetsReducer =
  (initialWidgets: Widget[] = []) =>
  (
    state: WidgetsState = { activeWidgets: initialWidgets },
    action: AnyAction,
  ) => {
    if (action.type === 'widgets/addWidget') {
      const nextIndex = state.activeWidgets.length + 1;
      return {
        ...state,
        activeWidgets: [
          ...state.activeWidgets,
          {
            id: `widget-${nextIndex}`,
            type: action.payload,
            title: 'Logs',
            x: 0,
            y: 0,
            w: 1,
            h: 1,
          },
        ],
      };
    }
    return state;
  };

const createTestStore = (initialWidgets: Widget[] = []) =>
  configureStore({
    reducer: {
      logs: logsReducer,
      widgets: createWidgetsReducer(initialWidgets),
    },
  });

const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(Provider, { store, children });
};

const createLogsWidget = (): Widget => ({
  id: 'logs-1',
  type: WidgetType.LOGS,
  title: 'Logs',
  x: 0,
  y: 0,
  w: 1,
  h: 1,
});

let localStorageMock: { [key: string]: string };

beforeEach(() => {
  localStorageMock = {};
  global.localStorage = {
    getItem: vi.fn((key: string) => localStorageMock[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      localStorageMock[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete localStorageMock[key];
    }),
    clear: vi.fn(() => {
      localStorageMock = {};
    }),
    length: 0,
    key: vi.fn(),
  };
});

describe('useOpenLogsWidget', () => {
  it('dispatches setUIFilter with the provided payload', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useOpenLogsWidget(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current({ levels: [GpacLogLevel.ERROR] });
    });

    expect(store.getState().logs.uiFilter).toEqual({
      levels: [GpacLogLevel.ERROR],
    });
  });

  it('opens the widget if not already present', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useOpenLogsWidget(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current({ levels: [GpacLogLevel.WARNING] });
    });

    expect(store.getState().widgets.activeWidgets).toHaveLength(1);
    expect(store.getState().widgets.activeWidgets[0].type).toBe(
      WidgetType.LOGS,
    );
  });

  it('does not re-open the widget if already present', () => {
    const store = createTestStore([createLogsWidget()]);
    const { result } = renderHook(() => useOpenLogsWidget(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current({ levels: [GpacLogLevel.INFO] });
    });

    expect(store.getState().widgets.activeWidgets).toHaveLength(1);
    expect(store.getState().widgets.activeWidgets[0].type).toBe(
      WidgetType.LOGS,
    );
  });
});
