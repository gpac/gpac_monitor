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

const RAW_SOURCE = { codec: 'raw', decoderConfig: null };

describe('PreviewHandler', () => {
  it('stopPreview sends stop_pid_preview with the filterIdx, pidIdx and direction when connected', () => {
    const dependencies = makeDependencies();
    const handler = new PreviewHandler(dependencies);

    handler.stopPreview(3, 1, 'output');

    expect(dependencies.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'stop_pid_preview',
        idx: 3,
        pidIdx: 1,
        direction: 'output',
      }),
    );
  });

  it('stopPreview resets state without sending when the socket is already disconnected', () => {
    const dependencies = makeDependencies({ isConnected: vi.fn(() => false) });
    const handler = new PreviewHandler(dependencies);

    expect(() => handler.stopPreview(3, 1, 'output')).not.toThrow();

    expect(dependencies.send).not.toHaveBeenCalled();
    expect(handler.getSnapshot()).toEqual({
      filterIdx: null,
      pidIdx: null,
      loading: false,
      error: null,
    });
  });

  it('requestPreview shows an unsupported codec error without sending start_pid_preview', async () => {
    const dependencies = makeDependencies();
    const handler = new PreviewHandler(dependencies);

    await handler.requestPreview(5, 1, 'output', 'reframer', RAW_SOURCE);

    expect(dependencies.send).not.toHaveBeenCalled();
    expect(handler.getSnapshot()).toEqual({
      filterIdx: 5,
      pidIdx: null,
      loading: false,
      error: 'Codec not supported by this browser',
    });
  });
});
