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
      pidIdx: null,
      frame: null,
      loading: false,
      error: null,
    });
  });

  it('handlePreviewFrame reads filterIdx, pidIdx, dimensions and pixels from a PVWF frame', () => {
    const handler = new PreviewHandler(makeDependencies());

    // 'PVWF' + filterIdx=5, width=2, height=2, pidIdx=1, then 2x2 RGBA pixels.
    const width = 2;
    const height = 2;
    const pixelBytes = width * height * 4;
    const buffer = new ArrayBuffer(20 + pixelBytes);
    const view = new DataView(buffer);
    'PVWF'
      .split('')
      .forEach((char, index) => view.setUint8(index, char.charCodeAt(0)));
    view.setUint32(4, 5, true);
    view.setUint32(8, width, true);
    view.setUint32(12, height, true);
    view.setUint32(16, 1, true);
    for (let byteIndex = 0; byteIndex < pixelBytes; byteIndex++) {
      view.setUint8(20 + byteIndex, byteIndex);
    }

    handler.handlePreviewFrame(view);

    const state = handler.getSnapshot();
    expect(state.filterIdx).toBe(5);
    expect(state.pidIdx).toBe(1);
    expect(state.frame?.width).toBe(width);
    expect(state.frame?.height).toBe(height);
    expect(state.frame?.pixels.length).toBe(pixelBytes);
  });
});
