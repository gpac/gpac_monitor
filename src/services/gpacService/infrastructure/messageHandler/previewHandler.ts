import { WSMessageType, PVWF_HEADER_SIZE } from '@/services/ws/types';
import type { PreviewErrorMessage } from '@/services/ws/types';
import { UpdatableSubscribable } from '@/services/utils/UpdatableSubcribable';
import { resolveWebCodecsConfig } from '@/utils/gpac';
import type { MessageHandlerDependencies } from './types';

export interface PreviewSource {
  codec: string;
  decoderConfig: string | null | undefined;
}

export interface PreviewFrame {
  png: Uint8Array;
}

export interface PreviewHandlerState {
  filterIdx: number | null;
  pidIdx: number | null;
  frame: PreviewFrame | null;
  loading: boolean;
  error: string | null;
}

const EMPTY_PREVIEW_STATE: PreviewHandlerState = {
  filterIdx: null,
  pidIdx: null,
  frame: null,
  loading: false,
  error: null,
};

export class PreviewHandler extends UpdatableSubscribable<PreviewHandlerState> {
  private requestToken = 0;

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
    this.updateDataAndNotify({
      filterIdx,
      pidIdx: null,
      frame: null,
      loading: true,
      error: null,
    });
    const webCodecsConfig = await resolveWebCodecsConfig(
      source.codec,
      source.decoderConfig,
    );
    if (token !== this.requestToken) return;
    this.dependencies.send({
      type: WSMessageType.START_PID_PREVIEW,
      idx: filterIdx,
      pidIdx,
      direction,
      name: filterName,
      mode: webCodecsConfig ? 'webcodecs' : 'png',
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
    this.updateDataAndNotify({ ...EMPTY_PREVIEW_STATE });
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
    this.updateDataAndNotify({ ...EMPTY_PREVIEW_STATE });
  }
}
