import { describe, it, expect, vi } from 'vitest';
import { PreviewHandler } from '../previewHandler';
import { PreviewWorker } from '../previewWorker';
import type { MessageHandlerDependencies } from '../types';

vi.mock('../previewWorker', () => ({
  PreviewWorker: { open: vi.fn() },
}));

vi.mock('@/utils/gpac', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/gpac')>()),
  resolveWebCodecsConfig: vi.fn(async () => ({ codec: 'avc1.64002a' })),
}));

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

function sentPreviewId(dependencies: MessageHandlerDependencies): number {
  const lastCall = vi.mocked(dependencies.send).mock.calls.at(-1);
  return (lastCall?.[0] as { previewId: number }).previewId;
}

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
const H264_SOURCE = { codec: 'avc', decoderConfig: null };

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

  it('decodes frames of the current previewId and ignores frames of a closed one', async () => {
    const dependencies = makeDependencies();
    const handler = new PreviewHandler(dependencies);
    openFakeWorker();
    await handler.requestPreview(5, 0, 'output', 'reframer', H264_SOURCE);
    const closedPreviewId = sentPreviewId(dependencies);
    handler.stopPreview(5, 0, 'output');
    const currentWorker = openFakeWorker();
    await handler.requestPreview(5, 0, 'output', 'reframer', H264_SOURCE);
    const currentPreviewId = sentPreviewId(dependencies);

    handler.handleWebCodecsFrame(makePvwcFrame(closedPreviewId));
    handler.handleWebCodecsFrame(makePvwcFrame(currentPreviewId));

    expect(currentPreviewId).not.toBe(closedPreviewId);
    expect(currentWorker.decodePacket).toHaveBeenCalledTimes(1);
    expect(
      currentWorker.decodePacket.mock.calls[0][0].getUint32(4, true),
    ).toBe(currentPreviewId);
  });

  it('ignores a preview_error of a closed previewId', async () => {
    const dependencies = makeDependencies();
    const handler = new PreviewHandler(dependencies);
    openFakeWorker();
    await handler.requestPreview(5, 0, 'output', 'reframer', H264_SOURCE);
    const closedPreviewId = sentPreviewId(dependencies);
    handler.stopPreview(5, 0, 'output');
    openFakeWorker();
    await handler.requestPreview(5, 0, 'output', 'reframer', H264_SOURCE);

    handler.handlePreviewError({
      message: 'preview_error',
      previewId: closedPreviewId,
      error: 'filter not found',
    });

    expect(handler.getSnapshot().error).toBeNull();
  });
});
