import { WSMessageType } from '@/services/ws/types';
import type {
  PreviewErrorMessage,
  PreviewStoppedMessage,
} from '@/services/ws/types';
import { UpdatableSubscribable } from '@/services/utils/UpdatableSubcribable';
import { resolveWebCodecsConfig } from '@/utils/gpac';
import { PreviewWorker } from './previewWorker';
import type {
  MessageHandlerDependencies,
  PreviewHandlerState,
  PreviewSource,
} from './types';

export type { PreviewHandlerState, PreviewSource } from './types';

const EMPTY_PREVIEW_STATE: PreviewHandlerState = {
  filterIdx: null,
  pidIdx: null,
  loading: false,
  error: null,
};

export class PreviewHandler extends UpdatableSubscribable<PreviewHandlerState> {
  private requestToken = 0;
  private decoder: PreviewWorker | null = null;
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
    if (!webCodecsConfig) {
      this.showError(filterIdx, 'Codec not supported by this browser');
      return;
    }
    this.decoder = PreviewWorker.open(
      webCodecsConfig,
      (frame) => this.frameListener?.(frame),
      (error) => this.handleDecoderError(filterIdx, error),
    );
    if (!this.decoder) {
      this.showError(filterIdx, 'WebCodecs decoder unavailable');
      return;
    }
    this.dependencies.send({
      type: WSMessageType.START_PID_PREVIEW,
      previewId: token,
      idx: filterIdx,
      pidIdx,
      direction,
      name: filterName,
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

  public handleWebCodecsFrame(dataView: DataView): void {
    if (dataView.getUint32(4, true) !== this.requestToken) return;
    this.decoder?.decodePacket(dataView);
  }

  // Stores the error returned by the backend.
  public handlePreviewError(data: PreviewErrorMessage): void {
    if (data.previewId !== this.requestToken) return;
    this.showError(this.getSnapshot().filterIdx, data.error);
  }

  // Resets state on explicit stop confirmation.
  public handlePreviewStopped(data: PreviewStoppedMessage): void {
    if (data.previewId !== this.requestToken) return;
    this.updateDataAndNotify({ ...EMPTY_PREVIEW_STATE });
  }

  public cleanup(): void {
    this.closeDecoder();
    this.updateDataAndNotify({ ...EMPTY_PREVIEW_STATE });
  }

  private handleDecoderError(filterIdx: number, error: unknown): void {
    console.warn('[Preview] WebCodecs decoding failed', error);
    this.closeDecoder();
    this.showError(filterIdx, 'WebCodecs decoding failed');
  }

  private showError(filterIdx: number | null, message: string): void {
    this.updateDataAndNotify({ ...EMPTY_PREVIEW_STATE, filterIdx, error: message });
  }

  private closeDecoder(): void {
    this.decoder?.close();
    this.decoder = null;
  }
}
