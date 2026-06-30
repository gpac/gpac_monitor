import { WSMessageType } from '@/services/ws/types';
import type {
  PreviewFrameMessage,
  PreviewErrorMessage,
} from '@/services/ws/types';
import { UpdatableSubscribable } from '@/services/utils/UpdatableSubcribable';
import type { MessageHandlerDependencies } from './types';

export interface PreviewHandlerState {
  filterIdx: number | null;
  dataBase64: string | null;
  loading: boolean;
  error: string | null;
}

const EMPTY_PREVIEW_STATE: PreviewHandlerState = {
  filterIdx: null,
  dataBase64: null,
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
      dataBase64: null,
      loading: true,
      error: null,
    });
  }

  // Sends stop request and resets state.
  public stopPreview(filterIdx: number): void {
    this.dependencies.send({
      type: WSMessageType.STOP_PID_PREVIEW,
      idx: filterIdx,
    });
    this.updateDataAndNotify({ ...EMPTY_PREVIEW_STATE });
  }

  // Stores the received Base64 frame.
  public handlePreviewFrame(data: PreviewFrameMessage): void {
    this.updateDataAndNotify({
      filterIdx: data.filterIdx,
      dataBase64: data.dataBase64,
      loading: false,
      error: null,
    });
  }

  // Stores the error returned by the backend.
  public handlePreviewError(data: PreviewErrorMessage): void {
    this.updateDataAndNotify({
      filterIdx: data.filterIdx,
      dataBase64: null,
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
