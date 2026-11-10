import { PVWC_HEADER_SIZE, PVWC_FLAG_KEYFRAME } from '@/services/ws/types';
import {
  annexBToAvcc,
  hasPictureSlice,
  isAnnexB,
} from '@/utils/gpac/webcodecs-config';

const MAX_DECODE_QUEUE_SIZE = 16;
// Reopenings allowed without any decoded frame in between before giving up.
const MAX_REOPENS_WITHOUT_FRAME = 3;

export class PreviewDecoder {
  private decoder: VideoDecoder;
  private waitingForKeyframe = true;
  private pendingBytes: Uint8Array | null = null;
  private pendingIsKeyframe = false;
  private reopensWithoutFrame = 0;
  private stopped = false;
  private isAnnexBStream: boolean | null = null;

  private constructor(
    private readonly config: VideoDecoderConfig,
    private readonly onFrame: (frame: VideoFrame) => void,
    private readonly onError: (error: unknown) => void,
  ) {
    this.decoder = this.createDecoder();
  }

  private createDecoder(): VideoDecoder {
    const decoder = new VideoDecoder({
      output: (frame) => {
        this.reopensWithoutFrame = 0;
        try {
          this.onFrame(frame);
        } finally {
          frame.close();
        }
      },
      error: (error) => this.reopen(error),
    });
    decoder.configure(this.config);
    return decoder;
  }

  // WebCodecs decoders fail on unusual streams or lost GPU resources: replace and resume at the next keyframe.
  private reopen(error: unknown): void {
    if (this.stopped) return;
    console.warn(
      '[Preview] WebCodecs decoder error, reopening',
      error instanceof Error ? `${error.name}: ${error.message}` : error,
    );
    if (this.decoder.state !== 'closed') this.decoder.close();
    this.waitingForKeyframe = true;
    this.pendingBytes = null;
    this.pendingIsKeyframe = false;
    if (this.reopensWithoutFrame >= MAX_REOPENS_WITHOUT_FRAME) {
      this.stopped = true;
      this.onError(error);
      return;
    }
    this.reopensWithoutFrame += 1;
    try {
      this.decoder = this.createDecoder();
    } catch (reopenError) {
      this.stopped = true;
      this.onError(reopenError);
    }
  }

  public static open(
    config: VideoDecoderConfig,
    onFrame: (frame: VideoFrame) => void,
    onError: (error: unknown) => void,
  ): PreviewDecoder | null {
    try {
      return new PreviewDecoder(config, onFrame, onError);
    } catch (error) {
      console.warn('[Preview] WebCodecs decoder unavailable', error);
      return null;
    }
  }

  public decodePacket(dataView: DataView): void {
    if (this.stopped || dataView.byteLength <= PVWC_HEADER_SIZE) return;
    const receivedBytes = new Uint8Array(
      dataView.buffer,
      dataView.byteOffset + PVWC_HEADER_SIZE,
      dataView.byteLength - PVWC_HEADER_SIZE,
    );
    // AV1 packets are OBU sequences, not NAL units: no Annex B conversion, no picture-slice check.
    const isNalStream = !this.config.codec.startsWith('av01');
    // Decided once on the first packet; the decoder only reads AVCC.
    this.isAnnexBStream ??= isNalStream && isAnnexB(receivedBytes);
    const packetBytes = this.isAnnexBStream
      ? annexBToAvcc(receivedBytes)
      : receivedBytes;
    const packetIsKeyframe =
      (dataView.getUint32(12, true) & PVWC_FLAG_KEYFRAME) !== 0;
    if (isNalStream && !hasPictureSlice(packetBytes, this.config.codec)) {
      this.pendingBytes = packetBytes;
      this.pendingIsKeyframe = packetIsKeyframe;
      return;
    }
    const isKeyframe = packetIsKeyframe || this.pendingIsKeyframe;
    const data = this.prependPendingBytes(packetBytes);
    try {
      if (this.decoder.decodeQueueSize > MAX_DECODE_QUEUE_SIZE) {
        console.warn(
          `[Preview] decode queue overflow (${this.decoder.decodeQueueSize}), resetting until next keyframe`,
        );
        this.decoder.reset();
        this.decoder.configure(this.config);
        this.waitingForKeyframe = true;
      }
      if (this.waitingForKeyframe && !isKeyframe) return;
      this.waitingForKeyframe = false;
      this.decoder.decode(
        new EncodedVideoChunk({
          type: isKeyframe ? 'key' : 'delta',
          timestamp: Math.round(dataView.getFloat64(16, true)),
          data,
        }),
      );
    } catch (error) {
      this.onError(error);
    }
  }

  // A NAL-only packet (e.g. SEI recovery point) belongs to the next picture's access unit.
  private prependPendingBytes(packetBytes: Uint8Array): Uint8Array {
    const pendingBytes = this.pendingBytes;
    this.pendingBytes = null;
    this.pendingIsKeyframe = false;
    if (!pendingBytes) return packetBytes;
    const merged = new Uint8Array(pendingBytes.length + packetBytes.length);
    merged.set(pendingBytes);
    merged.set(packetBytes, pendingBytes.length);
    return merged;
  }

  public close(): void {
    this.stopped = true;
    if (this.decoder.state !== 'closed') this.decoder.close();
  }
}
