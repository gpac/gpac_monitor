import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Clean up after each test case
afterEach(() => {
  cleanup();
});

// Mock widget icons to prevent module evaluation issues
vi.mock('@/components/Widget/widgetIcons', () => ({
  widgetIcons: {},
}));

// Mock widget registry to prevent WidgetType enum evaluation issues
vi.mock('@/components/Widget/registry', () => ({
  widgetRegistry: {},
  createWidgetInstance: vi.fn(() => null),
  getAllWidgets: vi.fn(() => []),
  getWidgetDefinition: vi.fn(() => null),
}));

// Mock GPAC service to prevent ConnectionStatus enum evaluation issues
vi.mock('@/services/gpacService', () => ({
  gpacService: {
    logs: {
      updateLogLevel: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      getSnapshot: vi.fn(() => ({ isSubscribed: false })),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
    getStatus: vi.fn(() => 'DISCONNECTED'),
  },
}));

// Mock WebSocket globally
global.WebSocket = class MockWebSocket {
  constructor() {}
  close() {}
  send() {}
} as any;

// Mock ResizeObserver globally
global.ResizeObserver = class MockResizeObserver {
  constructor(_callback: ResizeObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

// Mock matchMedia for uPlot and other libraries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
