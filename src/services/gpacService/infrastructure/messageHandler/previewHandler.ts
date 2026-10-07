import { WSMessageType, PVWF_HEADER_SIZE } from '@/services/ws/types';
import type { PreviewErrorMessage } from '@/services/ws/types';
import { UpdatableSubscribable } from '@/services/utils/UpdatableSubcribable';
import { resolveWebCodecsConfig } from '@/utils/gpac';
import { PreviewDecoder } from './previewDecoder';
import type {
  MessageHandlerDependencies,
  PreviewHandlerState,
  PreviewSource,
} from './types';

export type { PreviewFrame, PreviewHandlerState, PreviewSource } from './types';

const EMPTY_PREVIEW_STATE: PreviewHandlerState = {
  filterIdx: null,
  pidIdx: null,
  frame: null,
  loading: false,
  error: null,
};

export class PreviewHandler extends UpdatableSubscribable<PreviewHandlerState> {
  private requestToken = 0;
  private decoder: PreviewDecoder | null = null;
  private frameListener: ((frame: VideoFrame) => void) | null = null;

  constructor(private dependencies: MessageHandlerDependencies) {
    super({ ...EMPTY_PREVIEW_STATE });
  }

  // Sends start request and sets loading state.
  public async requestPreview(
    filterIdx: number,
    pidIdx: number,
    direction: 'input' | 'output',
    filterName: string,
    source: PreviewSource,
  ): Promise<void> {
    const token = ++this.requestToken;
    this.closeDecoder();
    this.updateDataAndNotify({
      ...EMPTY_PREVIEW_STATE,
      filterIdx,
      loading: true,
    });
    const webCodecsConfig = await resolveWebCodecsConfig(
      source.codec,
      source.decoderConfig,
    );
    if (token !== this.requestToken) return;
    if (webCodecsConfig) {
      this.decoder = PreviewDecoder.open(
        webCodecsConfig,
        filterIdx,
        (frame) => this.frameListener?.(frame),
        (error) => this.handleDecoderError(filterIdx, error),
      );
    }
    this.dependencies.send({
      type: WSMessageType.START_PID_PREVIEW,
      idx: filterIdx,
      pidIdx,
      direction,
      name: filterName,
      mode: this.decoder ? 'webcodecs' : 'png',
    });
  }

  // Sends stop request (if still connected) and resets state.
  public stopPreview(
    filterIdx: number,
    pidIdx: number,
    direction: 'input' | 'output',
  ): void {
    this.requestToken++;
    if (this.dependencies.isConnected()) {
      this.dependencies.send({
        type: WSMessageType.STOP_PID_PREVIEW,
        idx: filterIdx,
        pidIdx,
        direction,
      });
    }
    this.cleanup();
  }

  public setFrameListener(
    listener: ((frame: VideoFrame) => void) | null,
  ): void {
    this.frameListener = listener;
  }

  // Reads a binary PVWF frame: header fields, then a zero-copy view on the PNG bytes.
  public handlePreviewFrame(dataView: DataView): void {
    if (dataView.byteLength <= PVWF_HEADER_SIZE) return;
    this.updateDataAndNotify({
      filterIdx: dataView.getUint32(4, true),
      pidIdx: dataView.getUint32(8, true),
      frame: {
        png: new Uint8Array(
          dataView.buffer,
          dataView.byteOffset + PVWF_HEADER_SIZE,
          dataView.byteLength - PVWF_HEADER_SIZE,
        ),
      },
      loading: false,
      error: null,
    });
  }

  public handleWebCodecsFrame(dataView: DataView): void {
    this.decoder?.decodePacket(dataView);
  }

  // Stores the error returned by the backend.
  public handlePreviewError(data: PreviewErrorMessage): void {
    this.updateDataAndNotify({
      filterIdx: data.filterIdx,
      pidIdx: null,
      frame: null,
      loading: false,
      error: data.error,
    });
  }

  // Resets state on explicit stop confirmation.
  public handlePreviewStopped(): void {
    this.updateDataAndNotify({ ...EMPTY_PREVIEW_STATE });
  }

  public cleanup(): void {
    this.closeDecoder();
    this.updateDataAndNotify({ ...EMPTY_PREVIEW_STATE });
  }

  private handleDecoderError(filterIdx: number, error: unknown): void {
    console.warn('[Preview] WebCodecs decoding failed', error);
    this.closeDecoder();
    this.updateDataAndNotify({
      ...EMPTY_PREVIEW_STATE,
      filterIdx,
      error: 'WebCodecs decoding failed',
    });
  }

  private closeDecoder(): void {
    this.decoder?.close();
    this.decoder = null;
  }
}
