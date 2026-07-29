import { describe, it, expect, vi } from 'vitest';
import { PreviewHandler } from '../previewHandler';
import type { MessageHandlerDependencies } from '../types';

function makeDependencies(
  overrides: Partial<MessageHandlerDependencies> = {},
): MessageHandlerDependencies {
  return {
    isConnected: vi.fn(() => true),
    send: vi.fn().mockResolvedValue(undefined),
    stopReconnection: vi.fn(),
    markEndOfSession: vi.fn(),
    ...overrides,
  };
}

describe('PreviewHandler', () => {
  it('stopPreview sends stop_pid_preview with the filterIdx when connected', () => {
    const dependencies = makeDependencies();
    const handler = new PreviewHandler(dependencies);

    handler.stopPreview(3);

    expect(dependencies.send).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'stop_pid_preview', idx: 3 }),
    );
  });

  it('stopPreview resets state without sending when the socket is already disconnected', () => {
    const dependencies = makeDependencies({ isConnected: vi.fn(() => false) });
    const handler = new PreviewHandler(dependencies);

    expect(() => handler.stopPreview(3)).not.toThrow();

    expect(dependencies.send).not.toHaveBeenCalled();
    expect(handler.getSnapshot()).toEqual({
      filterIdx: null,
      frame: null,
      loading: false,
      error: null,
    });
  });
});
