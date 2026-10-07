import { PVWC_HEADER_SIZE, PVWC_FLAG_KEYFRAME } from '@/services/ws/types';

const MAX_DECODE_QUEUE_SIZE = 16;

export class PreviewDecoder {
  private readonly decoder: VideoDecoder;
  private waitingForKeyframe = true;

  private constructor(
    private readonly config: VideoDecoderConfig,
    private readonly filterIdx: number,
    onFrame: (frame: VideoFrame) => void,
    private readonly onError: (error: unknown) => void,
  ) {
    this.decoder = new VideoDecoder({
      output: (frame) => {
        try {
          onFrame(frame);
        } finally {
          frame.close();
        }
      },
      error: onError,
    });
    this.decoder.configure(config);
  }

  public static open(
    config: VideoDecoderConfig,
    filterIdx: number,
    onFrame: (frame: VideoFrame) => void,
    onError: (error: unknown) => void,
  ): PreviewDecoder | null {
    try {
      return new PreviewDecoder(config, filterIdx, onFrame, onError);
    } catch (error) {
      console.warn('[Preview] WebCodecs decoder unavailable', error);
      return null;
    }
  }

  public decodePacket(dataView: DataView): void {
    if (dataView.byteLength <= PVWC_HEADER_SIZE) return;
    if (dataView.getUint32(4, true) !== this.filterIdx) return;
    const isKeyframe =
      (dataView.getUint32(12, true) & PVWC_FLAG_KEYFRAME) !== 0;
    try {
      if (this.decoder.decodeQueueSize > MAX_DECODE_QUEUE_SIZE) {
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
          data: new Uint8Array(
            dataView.buffer,
            dataView.byteOffset + PVWC_HEADER_SIZE,
            dataView.byteLength - PVWC_HEADER_SIZE,
          ),
        }),
      );
    } catch (error) {
      this.onError(error);
    }
  }

  public close(): void {
    if (this.decoder.state !== 'closed') this.decoder.close();
  }
}
