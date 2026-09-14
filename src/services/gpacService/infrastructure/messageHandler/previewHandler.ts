import { WSMessageType, PVWF_HEADER_SIZE } from '@/services/ws/types';
import type { PreviewErrorMessage } from '@/services/ws/types';
import { UpdatableSubscribable } from '@/services/utils/UpdatableSubcribable';
import type { MessageHandlerDependencies } from './types';

export interface PreviewFrame {
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
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
  constructor(private dependencies: MessageHandlerDependencies) {
    super({ ...EMPTY_PREVIEW_STATE });
  }

  // Sends start request and sets loading state.
  public requestPreview(filterIdx: number, filterName: string): void {
    this.dependencies.send({
      type: WSMessageType.START_PID_PREVIEW,
      idx: filterIdx,
      name: filterName,
    });
    this.updateDataAndNotify({
      filterIdx,
      pidIdx: null,
      frame: null,
      loading: true,
      error: null,
    });
  }

  // Sends stop request (if still connected) and resets state.
  public stopPreview(filterIdx: number): void {
    if (this.dependencies.isConnected()) {
      this.dependencies.send({
        type: WSMessageType.STOP_PID_PREVIEW,
        idx: filterIdx,
      });
    }
    this.updateDataAndNotify({ ...EMPTY_PREVIEW_STATE });
  }

  // Reads a binary PVWF frame: header fields, then a zero-copy view on the pixels.
  public handlePreviewFrame(dataView: DataView): void {
    if (dataView.byteLength <= PVWF_HEADER_SIZE) return;
    this.updateDataAndNotify({
      filterIdx: dataView.getUint32(4, true),
      pidIdx: dataView.getUint32(16, true),
      frame: {
        width: dataView.getUint32(8, true),
        height: dataView.getUint32(12, true),
        pixels: new Uint8ClampedArray(
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
