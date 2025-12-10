import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Clean up after each test case
afterEach(() => {
  cleanup();
});

// Mock WebSocket globally
global.WebSocket = class MockWebSocket {
  constructor() {}
  close() {}
  send() {}
} as any;

// Mock ResizeObserver globally
global.ResizeObserver = class MockResizeObserver {
  constructor(callback: ResizeObserverCallback) {}
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
