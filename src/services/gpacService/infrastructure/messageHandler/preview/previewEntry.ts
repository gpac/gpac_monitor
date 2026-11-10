import {
  PVWC_FLAG_KEYFRAMES_ONLY,
  PVWC_HEADER_SIZE,
  WSMessageType,
} from '@/services/ws/types';
import { UpdatableSubscribable } from '@/services/utils/UpdatableSubcribable';
import { isPreviewableCodec, resolveWebCodecsConfig } from '@/utils/gpac';
import { PreviewWorker } from './previewWorker';
import type {
  MessageHandlerDependencies,
  PreviewHandlerState,
  PreviewSource,
} from '../types';

export interface PreviewTarget {
  filterIdx: number;
  pidIdx: number;
  direction: 'input' | 'output';
}

export class PreviewEntry extends UpdatableSubscribable<PreviewHandlerState> {
  private decoder: PreviewWorker | null = null;
  private frameListener: ((frame: VideoFrame) => void) | null = null;
  private closed = false;

  constructor(
    public readonly previewId: number,
    public readonly target: PreviewTarget,
    public readonly source: PreviewSource,
    private readonly dependencies: MessageHandlerDependencies,
  ) {
    super({
      filterIdx: target.filterIdx,
      pidIdx: target.pidIdx,
      loading: true,
      error: null,
      keyframesOnly: false,
    });
  }

  // Opens the decoder worker, then asks the server for the PID packets.
  public async start(filterName: string): Promise<void> {
    const webCodecsConfig = await resolveWebCodecsConfig(
      this.source.codec,
      this.source.decoderConfig,
    );
    if (this.closed) return;
    if (!webCodecsConfig) {
      const isConfigMissing =
        isPreviewableCodec(this.source.codec) && !this.source.decoderConfig;
      this.showError(
        isConfigMissing
          ? 'No decoder configuration on this PID'
          : 'Codec not supported by this browser',
      );
      return;
    }
    this.decoder = PreviewWorker.open(
      webCodecsConfig,
      (frame) => this.handleFrame(frame),
      (error) => this.handleDecoderError(error),
    );
    if (!this.decoder) {
      this.showError('WebCodecs decoder unavailable');
      return;
    }
    this.dependencies.send({
      type: WSMessageType.START_PID_PREVIEW,
      previewId: this.previewId,
      idx: this.target.filterIdx,
      pidIdx: this.target.pidIdx,
      direction: this.target.direction,
      name: filterName,
    });
  }

  // Sends stop request (if still connected) and closes the decoder.
  public stop(): void {
    if (this.dependencies.isConnected()) {
      this.dependencies.send({
        type: WSMessageType.STOP_PID_PREVIEW,
        idx: this.target.filterIdx,
        pidIdx: this.target.pidIdx,
        direction: this.target.direction,
      });
    }
    this.close();
  }

  public close(): void {
    this.closed = true;
    this.closeDecoder();
  }

  public setFrameListener(
    listener: ((frame: VideoFrame) => void) | null,
  ): void {
    this.frameListener = listener;
  }

  public decodePacket(dataView: DataView): void {
    if (dataView.byteLength <= PVWC_HEADER_SIZE) return;
    const keyframesOnly =
      (dataView.getUint32(12, true) & PVWC_FLAG_KEYFRAMES_ONLY) !== 0;
    if (keyframesOnly !== this.getSnapshot().keyframesOnly) {
      this.updateDataAndNotify({ ...this.getSnapshot(), keyframesOnly });
    }
    this.decoder?.decodePacket(dataView);
  }

  public showError(message: string): void {
    this.updateDataAndNotify({
      ...this.getSnapshot(),
      loading: false,
      error: message,
    });
  }

  private handleFrame(frame: VideoFrame): void {
    if (this.getSnapshot().loading) {
      this.updateDataAndNotify({ ...this.getSnapshot(), loading: false });
    }
    this.frameListener?.(frame);
  }

  private handleDecoderError(error: unknown): void {
    console.warn('[Preview] WebCodecs decoding failed', error);
    this.closeDecoder();
    this.showError('WebCodecs decoding failed');
  }

  private closeDecoder(): void {
    this.decoder?.close();
    this.decoder = null;
  }
}
