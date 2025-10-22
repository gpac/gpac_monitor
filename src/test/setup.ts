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
