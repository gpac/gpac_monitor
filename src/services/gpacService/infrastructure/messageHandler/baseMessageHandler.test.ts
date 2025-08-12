import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseMessageHandler } from './baseMessageHandler';
import { MessageHandlerCallbacks, MessageHandlerDependencies } from './types';
import { GpacNotificationHandlers } from '../../types';

describe('BaseMessageHandler', () => {
  let messageHandler: BaseMessageHandler;
  let mockCallbacks: MessageHandlerCallbacks;
  let mockDependencies: MessageHandlerDependencies;
  let mockNotificationHandlers: GpacNotificationHandlers;
  let mockCurrentFilterId: () => number | null;
  let mockHasSubscription: () => boolean;
  let mockIsLoaded: () => boolean;

  beforeEach(() => {
    // Simple mock functions
    mockCurrentFilterId = vi.fn(() => null);
    mockHasSubscription = vi.fn(() => false);
    mockIsLoaded = vi.fn(() => true);

    // Mock callbacks
    mockCallbacks = {
      onUpdateFilterData: vi.fn(),
      onUpdateGraphData: vi.fn(),
      onSetLoading: vi.fn(),
      onSetFilterDetails: vi.fn(),
      onUpdateSessionStats: vi.fn(),
    };

    // Mock dependencies
    mockDependencies = {
      isConnected: vi.fn(() => true),
      send: vi.fn(),
    };

    // Mock notification handlers
    mockNotificationHandlers = {
      onError: vi.fn(),
      onFilterUpdate: vi.fn(),
      onConnectionStatus: vi.fn(),
    };

    messageHandler = new BaseMessageHandler(
      mockCurrentFilterId,
      mockHasSubscription,
      mockNotificationHandlers,
      mockCallbacks,
      mockDependencies,
      vi.fn(),
      mockIsLoaded,
    );
  });

  it('should create message handler instance', () => {
    expect(messageHandler).toBeDefined();
  });

  it('should expose session stats handler', () => {
    const sessionHandler = messageHandler.getSessionStatsHandler();
    expect(sessionHandler).toBeDefined();
  });

  it('should expose filter stats handler', () => {
    const filterHandler = messageHandler.getFilterStatsHandler();
    expect(filterHandler).toBeDefined();
  });

  it('should expose CPU stats handler', () => {
    const cpuHandler = messageHandler.getCPUStatsHandler();
    expect(cpuHandler).toBeDefined();
  });
});
