import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import pvwcFrame from '@/services/ws/__tests__/fixtures/pvwc_frame.json';
import { PVWC_HEADER_SIZE, PVWC_MAGIC } from '@/services/ws/types';
import { PreviewHandler } from '../previewHandler';
import { PreviewDecoder } from '../previewDecoder';
import { PreviewWorker } from '../previewWorker';
import type { MessageHandlerDependencies } from '../../types';

vi.mock('../previewWorker', () => ({
  PreviewWorker: { open: vi.fn() },
}));

vi.mock('@/utils/gpac', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/gpac')>()),
  resolveWebCodecsConfig: vi.fn(async () => ({ codec: 'avc1.64002a' })),
}));

const hexToBytes = (hex: string): number[] =>
  (hex.match(/../g) ?? []).map((byte) => parseInt(byte, 16));

const referenceFrame = (): DataView =>
  new DataView(Uint8Array.from(hexToBytes(pvwcFrame.frameHex)).buffer);

const dependencies: MessageHandlerDependencies = {
  isConnected: vi.fn(() => true),
  send: vi.fn().mockResolvedValue(undefined),
  stopReconnection: vi.fn(),
  markEndOfSession: vi.fn(),
};

interface DecodedChunk {
  type: string;
  timestamp: number;
  bytes: number[];
}

let decodedChunks: DecodedChunk[] = [];

class FakeEncodedVideoChunk {
  constructor(init: { type: string; timestamp: number; data: Uint8Array }) {
    decodedChunks.push({
      type: init.type,
      timestamp: init.timestamp,
      bytes: Array.from(init.data),
    });
  }
}

class FakeVideoDecoder {
  state = 'configured';
  decodeQueueSize = 0;
  configure(): void {}
  decode(): void {}
  reset(): void {}
  close(): void {
    this.state = 'closed';
  }
}

describe('PVWC reference frame on the client', () => {
  it('starts with the PVWC magic and a header of PVWC_HEADER_SIZE bytes', () => {
    const frameBytes = hexToBytes(pvwcFrame.frameHex);
    const magic = String.fromCharCode(...frameBytes.slice(0, 4));
    expect(magic).toBe(PVWC_MAGIC);
    expect(frameBytes.length - PVWC_HEADER_SIZE).toBe(
      hexToBytes(pvwcFrame.payloadHex).length,
    );
  });

  it('routes the frame to its preview and reads the keyframes-only flag', async () => {
    const fakeWorker = { decodePacket: vi.fn(), close: vi.fn() };
    vi.mocked(PreviewWorker.open).mockReturnValueOnce(
      fakeWorker as unknown as PreviewWorker,
    );
    const handler = new PreviewHandler(dependencies);
    const preview = handler.requestPreview(0, pvwcFrame.pidIdx, 'input', 'reframer', {
      codec: 'avc',
      decoderConfig: null,
    });
    await new Promise((resolve) => setTimeout(resolve));
    expect(preview.previewId).toBe(pvwcFrame.previewId);

    const frame = referenceFrame();
    handler.handleWebCodecsFrame(frame);

    expect(fakeWorker.decodePacket).toHaveBeenCalledWith(frame);
    expect(preview.getSnapshot().keyframesOnly).toBe(pvwcFrame.keyframesOnly);
  });

  describe('decoder', () => {
    beforeEach(() => {
      decodedChunks = [];
      vi.stubGlobal('VideoDecoder', FakeVideoDecoder);
      vi.stubGlobal('EncodedVideoChunk', FakeEncodedVideoChunk);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('decodes a key chunk at the frame CTS with the frame payload', () => {
      const decoder = PreviewDecoder.open(
        { codec: 'avc1.64002a' },
        vi.fn(),
        vi.fn(),
      );

      decoder?.decodePacket(referenceFrame());

      expect(decodedChunks).toEqual([
        {
          type: 'key',
          timestamp: pvwcFrame.ctsUs,
          bytes: hexToBytes(pvwcFrame.payloadHex),
        },
      ]);
    });
  });
});
