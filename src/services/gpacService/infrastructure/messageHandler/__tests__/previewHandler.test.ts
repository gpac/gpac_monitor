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

// Builds a 'PVWF' frame: magic + filterIdx/pidIdx header, then arbitrary PNG-encoded bytes.
function makePvwfFrame(
  filterIdx: number,
  pidIdx: number,
  pngByteLength: number,
): DataView {
  const buffer = new ArrayBuffer(12 + pngByteLength);
  const view = new DataView(buffer);
  'PVWF'
    .split('')
    .forEach((char, index) => view.setUint8(index, char.charCodeAt(0)));
  view.setUint32(4, filterIdx, true);
  view.setUint32(8, pidIdx, true);
  for (let byteIndex = 0; byteIndex < pngByteLength; byteIndex++) {
    view.setUint8(12 + byteIndex, byteIndex);
  }
  return view;
}

const PNG_SOURCE = { codec: 'raw', decoderConfig: null };

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
      frame: null,
      loading: false,
      error: null,
    });
  });

  it('handlePreviewFrame reads filterIdx, pidIdx and png bytes from a PVWF frame', () => {
    const handler = new PreviewHandler(makeDependencies());
    handler.requestPreview(5, 1, 'output', 'reframer', PNG_SOURCE);

    handler.handlePreviewFrame(makePvwfFrame(5, 1, 6));

    const state = handler.getSnapshot();
    expect(state.filterIdx).toBe(5);
    expect(state.pidIdx).toBe(1);
    expect(state.frame?.png.length).toBe(6);
  });

  // Regression: StrictMode remounts the panel, so a stop_pid_preview reply can land AFTER the
  // preview was re-requested. Frames must still render — never be gated on the reset state.
  it('handlePreviewFrame still renders frames after a late preview_stopped reset the state', () => {
    const handler = new PreviewHandler(makeDependencies());
    handler.requestPreview(5, 1, 'output', 'reframer', PNG_SOURCE);
    handler.stopPreview(5, 1, 'output');
    handler.requestPreview(5, 1, 'output', 'reframer', PNG_SOURCE);
    handler.handlePreviewStopped();

    handler.handlePreviewFrame(makePvwfFrame(5, 1, 6));

    const state = handler.getSnapshot();
    expect(state.filterIdx).toBe(5);
    expect(state.pidIdx).toBe(1);
    expect(state.frame?.png.length).toBe(6);
  });
});
