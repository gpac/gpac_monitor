import { describe, it, expect, vi } from 'vitest';
import { PreviewHandler } from '../previewHandler';
import { PreviewWorker } from '../previewWorker';
import type { MessageHandlerDependencies } from '../types';

vi.mock('../previewWorker', () => ({
  PreviewWorker: { open: vi.fn() },
}));

vi.mock('@/utils/gpac', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/gpac')>()),
  resolveWebCodecsConfig: vi.fn(async (codec: string) =>
    codec === 'raw' ? null : { codec: 'avc1.64002a' },
  ),
}));

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

function openFakeWorker() {
  const fakeWorker = { decodePacket: vi.fn(), close: vi.fn() };
  vi.mocked(PreviewWorker.open).mockReturnValueOnce(
    fakeWorker as unknown as PreviewWorker,
  );
  return fakeWorker;
}

function makePvwcFrame(previewId: number): DataView {
  const view = new DataView(new ArrayBuffer(28));
  view.setUint32(4, previewId, true);
  return view;
}

const flushCodecResolution = () =>
  new Promise((resolve) => setTimeout(resolve));

const RAW_SOURCE = { codec: 'raw', decoderConfig: null };
const H264_SOURCE = { codec: 'avc', decoderConfig: null };

describe('PreviewHandler', () => {
  it('stopPreview sends stop_pid_preview with the filterIdx, pidIdx and direction when connected', async () => {
    const dependencies = makeDependencies();
    const handler = new PreviewHandler(dependencies);
    openFakeWorker();
    const preview = handler.requestPreview(
      3,
      1,
      'output',
      'reframer',
      H264_SOURCE,
    );
    await flushCodecResolution();

    handler.stopPreview(preview);

    expect(dependencies.send).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: 'stop_pid_preview',
        idx: 3,
        pidIdx: 1,
        direction: 'output',
      }),
    );
  });

  it('stopPreview closes the worker without sending when the socket is already disconnected', async () => {
    const isConnected = vi.fn(() => true);
    const dependencies = makeDependencies({ isConnected });
    const handler = new PreviewHandler(dependencies);
    const worker = openFakeWorker();
    const preview = handler.requestPreview(
      3,
      1,
      'output',
      'reframer',
      H264_SOURCE,
    );
    await flushCodecResolution();
    isConnected.mockReturnValue(false);

    expect(() => handler.stopPreview(preview)).not.toThrow();

    expect(dependencies.send).toHaveBeenCalledTimes(1);
    expect(worker.close).toHaveBeenCalledTimes(1);
  });

  it('requestPreview shows an unsupported codec error without sending start_pid_preview', async () => {
    const dependencies = makeDependencies();
    const handler = new PreviewHandler(dependencies);

    const preview = handler.requestPreview(
      5,
      1,
      'output',
      'reframer',
      RAW_SOURCE,
    );
    await flushCodecResolution();

    expect(dependencies.send).not.toHaveBeenCalled();
    expect(preview.getSnapshot()).toEqual({
      filterIdx: 5,
      pidIdx: 1,
      loading: false,
      error: 'Codec not supported by this browser',
    });
  });

  it('routes each frame to its own preview and keeps the other open when one closes', async () => {
    const handler = new PreviewHandler(makeDependencies());
    const firstWorker = openFakeWorker();
    const secondWorker = openFakeWorker();
    const firstPreview = handler.requestPreview(
      5,
      0,
      'output',
      'reframer',
      H264_SOURCE,
    );
    const secondPreview = handler.requestPreview(
      5,
      1,
      'output',
      'reframer',
      H264_SOURCE,
    );
    await flushCodecResolution();

    handler.handleWebCodecsFrame(makePvwcFrame(firstPreview.previewId));
    handler.handleWebCodecsFrame(makePvwcFrame(secondPreview.previewId));
    handler.stopPreview(firstPreview);
    handler.handleWebCodecsFrame(makePvwcFrame(firstPreview.previewId));
    handler.handleWebCodecsFrame(makePvwcFrame(secondPreview.previewId));

    expect(firstWorker.decodePacket).toHaveBeenCalledTimes(1);
    expect(secondWorker.decodePacket).toHaveBeenCalledTimes(2);
    expect(secondWorker.close).not.toHaveBeenCalled();
  });

  it('shows a preview_error only on the preview it targets', async () => {
    const handler = new PreviewHandler(makeDependencies());
    openFakeWorker();
    openFakeWorker();
    const firstPreview = handler.requestPreview(
      5,
      0,
      'output',
      'reframer',
      H264_SOURCE,
    );
    const secondPreview = handler.requestPreview(
      5,
      1,
      'output',
      'reframer',
      H264_SOURCE,
    );
    await flushCodecResolution();

    handler.handlePreviewError({
      message: 'preview_error',
      previewId: secondPreview.previewId,
      error: 'not a video PID',
    });

    expect(firstPreview.getSnapshot().error).toBeNull();
    expect(secondPreview.getSnapshot().error).toBe('not a video PID');
  });
});
