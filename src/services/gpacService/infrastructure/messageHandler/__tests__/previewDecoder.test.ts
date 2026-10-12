import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PreviewDecoder } from '../previewDecoder';

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

// Builds a 'PVWC' packet: magic + previewId/pidIdx/flags header + µs timestamp, then AVCC bytes.
function makePvwcPacket(
  filterIdx: number,
  isKeyframe: boolean,
  timestampUs: number,
  avccBytes: number[],
): DataView {
  const buffer = new ArrayBuffer(24 + avccBytes.length);
  const view = new DataView(buffer);
  'PVWC'
    .split('')
    .forEach((char, index) => view.setUint8(index, char.charCodeAt(0)));
  view.setUint32(4, filterIdx, true);
  view.setUint32(8, 0, true);
  view.setUint32(12, isKeyframe ? 1 : 0, true);
  view.setFloat64(16, timestampUs, true);
  new Uint8Array(buffer, 24).set(avccBytes);
  return view;
}

const IDR_SLICE = [0x00, 0x00, 0x00, 0x03, 0x65, 0x88, 0x84];
// Real SEI-only packet recorded from GPAC (recovery point, open GOP, sap=3).
const SEI_RECOVERY_POINT = [
  0x00, 0x00, 0x00, 0x05, 0x06, 0x06, 0x01, 0xc4, 0x80,
];
const NON_IDR_SLICE = [0x00, 0x00, 0x00, 0x03, 0x41, 0x9a, 0x00];

describe('PreviewDecoder', () => {
  beforeEach(() => {
    decodedChunks = [];
    vi.stubGlobal('VideoDecoder', FakeVideoDecoder);
    vi.stubGlobal('EncodedVideoChunk', FakeEncodedVideoChunk);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Regression: FFmpeg rejects a chunk without any picture slice (EncodingError).
  it('prepends a SEI-only packet to the next picture instead of decoding it alone', () => {
    const onError = vi.fn();
    const decoder = PreviewDecoder.open(
      { codec: 'avc1.64002a' },
      vi.fn(),
      onError,
    );

    decoder?.decodePacket(makePvwcPacket(7, true, 5_066_000, IDR_SLICE));
    decoder?.decodePacket(
      makePvwcPacket(7, false, 6_039_367, SEI_RECOVERY_POINT),
    );
    decoder?.decodePacket(makePvwcPacket(7, false, 6_072_733, NON_IDR_SLICE));

    expect(onError).not.toHaveBeenCalled();
    expect(decodedChunks).toEqual([
      { type: 'key', timestamp: 5_066_000, bytes: IDR_SLICE },
      {
        type: 'delta',
        timestamp: 6_072_733,
        bytes: [...SEI_RECOVERY_POINT, ...NON_IDR_SLICE],
      },
    ]);
  });

  it('a SEI-only packet flagged key makes the merged chunk a keyframe', () => {
    const onError = vi.fn();
    const decoder = PreviewDecoder.open(
      { codec: 'avc1.64002a' },
      vi.fn(),
      onError,
    );

    decoder?.decodePacket(
      makePvwcPacket(7, true, 6_039_367, SEI_RECOVERY_POINT),
    );
    decoder?.decodePacket(makePvwcPacket(7, false, 6_072_733, NON_IDR_SLICE));

    expect(onError).not.toHaveBeenCalled();
    expect(decodedChunks).toEqual([
      {
        type: 'key',
        timestamp: 6_072_733,
        bytes: [...SEI_RECOVERY_POINT, ...NON_IDR_SLICE],
      },
    ]);
  });
});
