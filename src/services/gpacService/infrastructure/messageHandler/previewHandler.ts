import { WSMessageType } from '@/services/ws/types';
import type {
  PreviewFrameMessage,
  PreviewErrorMessage,
} from '@/services/ws/types';
import { UpdatableSubscribable } from '@/services/utils/UpdatableSubcribable';
import type { MessageHandlerDependencies } from './types';

export interface PreviewFrame {
  width: number;
  height: number;
  dataBase64: string;
}

export interface PreviewHandlerState {
  filterIdx: number | null;
  frame: PreviewFrame | null;
  loading: boolean;
  error: string | null;
}

const EMPTY_PREVIEW_STATE: PreviewHandlerState = {
  filterIdx: null,
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

  // Stores the received Base64 frame.
  public handlePreviewFrame(data: PreviewFrameMessage): void {
    this.updateDataAndNotify({
      filterIdx: data.filterIdx,
      frame: {
        width: data.width,
        height: data.height,
        dataBase64: data.dataBase64,
      },
      loading: false,
      error: null,
    });
  }

  // Stores the error returned by the backend.
  public handlePreviewError(data: PreviewErrorMessage): void {
    this.updateDataAndNotify({
      filterIdx: data.filterIdx,
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
