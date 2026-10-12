import type {
  PreviewErrorMessage,
  PreviewStoppedMessage,
} from '@/services/ws/types';
import { PreviewEntry } from './previewEntry';
import type { MessageHandlerDependencies, PreviewSource } from './types';

export type { PreviewHandlerState, PreviewSource } from './types';
export type { PreviewEntry } from './previewEntry';

// Routes server preview traffic to the open previews, keyed by the previewId the client chose.
export class PreviewHandler {
  private nextPreviewId = 0;
  private readonly previews = new Map<number, PreviewEntry>();

  constructor(private dependencies: MessageHandlerDependencies) {}

  public requestPreview(
    filterIdx: number,
    pidIdx: number,
    direction: 'input' | 'output',
    filterName: string,
    source: PreviewSource,
  ): PreviewEntry {
    const preview = new PreviewEntry(
      ++this.nextPreviewId,
      { filterIdx, pidIdx, direction },
      this.dependencies,
    );
    this.previews.set(preview.previewId, preview);
    void preview.start(filterName, source);
    return preview;
  }

  public stopPreview(preview: PreviewEntry): void {
    this.previews.delete(preview.previewId);
    preview.stop();
  }

  public handleWebCodecsFrame(dataView: DataView): void {
    this.previews.get(dataView.getUint32(4, true))?.decodePacket(dataView);
  }

  public handlePreviewError(data: PreviewErrorMessage): void {
    this.previews.get(data.previewId)?.showError(data.error);
  }

  public handlePreviewStopped(data: PreviewStoppedMessage): void {
    this.previews.get(data.previewId)?.close();
    this.previews.delete(data.previewId);
  }

  public cleanup(): void {
    this.previews.forEach((preview) => preview.close());
    this.previews.clear();
  }
}
