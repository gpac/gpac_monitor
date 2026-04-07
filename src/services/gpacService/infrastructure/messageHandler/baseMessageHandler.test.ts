import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseMessageHandler } from './baseMessageHandler';
import { MessageHandlerCallbacks, MessageHandlerDependencies } from './types';
import { GpacNotificationHandlers } from '../../types';

function createMockCallbacks(): MessageHandlerCallbacks {
  return {
    onUpdateGraphData: vi.fn(),
    onSetLoading: vi.fn(),
    onUpdateSessionStats: vi.fn(),
    onLogsUpdate: vi.fn(),
    onLogSubscriptionChange: vi.fn(),
    onPidReconfigured: vi.fn(),
    onArgUpdated: vi.fn(),
  };
}

function createMockDependencies(): MessageHandlerDependencies {
  return {
    isConnected: vi.fn(() => true),
    send: vi.fn(),
    stopReconnection: vi.fn(),
    markEndOfSession: vi.fn(),
  };
}

function createHandler(callbacks: MessageHandlerCallbacks) {
  const notificationHandlers: GpacNotificationHandlers = {
    onError: vi.fn(),
    onFilterUpdate: vi.fn(),
    onConnectionStatus: vi.fn(),
  };
  return new BaseMessageHandler(
    notificationHandlers,
    callbacks,
    createMockDependencies(),
  );
}

function simulateMessage(handler: BaseMessageHandler, data: any) {
  const json = JSON.stringify(data);
  const encoder = new TextEncoder();
  const buffer = encoder.encode(json);
  const dataView = new DataView(buffer.buffer);
  handler.handleDefaultMessage({} as any, dataView);
}

describe('BaseMessageHandler', () => {
  let callbacks: MessageHandlerCallbacks;
  let handler: BaseMessageHandler;

  beforeEach(() => {
    callbacks = createMockCallbacks();
    handler = createHandler(callbacks);
  });

  it('should create message handler instance', () => {
    expect(handler).toBeDefined();
  });

  it('should expose session stats handler', () => {
    expect(handler.getSessionStatsHandler()).toBeDefined();
  });

  it('should expose filter stats handler', () => {
    expect(handler.getFilterStatsHandler()).toBeDefined();
  });

  it('should expose CPU stats handler', () => {
    expect(handler.getCPUStatsHandler()).toBeDefined();
  });

  describe('filter_pid_reconfigured', () => {
    it('should call onPidReconfigured with indexes', () => {
      simulateMessage(handler, {
        message: 'filter_pid_reconfigured',
        indexes: [0, 2, 5],
      });

      expect(callbacks.onPidReconfigured).toHaveBeenCalledWith([0, 2, 5]);
    });

    it('should call onPidReconfigured for single filter', () => {
      simulateMessage(handler, {
        message: 'filter_pid_reconfigured',
        indexes: [3],
      });

      expect(callbacks.onPidReconfigured).toHaveBeenCalledWith([3]);
    });

    it('should not call onArgUpdated on pid reconfigured', () => {
      simulateMessage(handler, {
        message: 'filter_pid_reconfigured',
        indexes: [1],
      });

      expect(callbacks.onArgUpdated).not.toHaveBeenCalled();
    });
  });

  describe('filter_arg_updated', () => {
    it('should call onArgUpdated with indexes', () => {
      simulateMessage(handler, {
        message: 'filter_arg_updated',
        indexes: [1, 4],
      });

      expect(callbacks.onArgUpdated).toHaveBeenCalledWith([1, 4]);
    });

    it('should call onArgUpdated for single filter', () => {
      simulateMessage(handler, {
        message: 'filter_arg_updated',
        indexes: [7],
      });

      expect(callbacks.onArgUpdated).toHaveBeenCalledWith([7]);
    });

    it('should not call onPidReconfigured on arg updated', () => {
      simulateMessage(handler, {
        message: 'filter_arg_updated',
        indexes: [2],
      });

      expect(callbacks.onPidReconfigured).not.toHaveBeenCalled();
    });
  });
});
