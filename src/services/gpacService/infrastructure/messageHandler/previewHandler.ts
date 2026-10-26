import type {
  PreviewErrorMessage,
  PreviewStoppedMessage,
} from '@/services/ws/types';
import { SubscriptionLifecycle } from '@/services/utils/SubscriptionLifecycle';
import { PreviewEntry, type PreviewTarget } from './previewEntry';
import type { MessageHandlerDependencies, PreviewSource } from './types';

export type { PreviewHandlerState, PreviewSource } from './types';
export type { PreviewEntry } from './previewEntry';

const toPreviewKey = ({ filterIdx, direction, pidIdx }: PreviewTarget) =>
  `${filterIdx}:${direction}:${pidIdx}`;

const isSameSource = (current: PreviewSource, next: PreviewSource) =>
  current.codec === next.codec && current.decoderConfig === next.decoderConfig;

// Routes server preview traffic to the open previews, keyed by the previewId the client chose.
export class PreviewHandler {
  private nextPreviewId = 0;
  private readonly previews = new Map<number, PreviewEntry>();
  private readonly lifecycle = new SubscriptionLifecycle<string>();

  constructor(private dependencies: MessageHandlerDependencies) {}

  public requestPreview(
    filterIdx: number,
    pidIdx: number,
    direction: 'input' | 'output',
    filterName: string,
    source: PreviewSource,
  ): PreviewEntry {
    const previewKey = toPreviewKey({ filterIdx, pidIdx, direction });
    const existingPreview = [...this.previews.values()].find(
      (preview) => toPreviewKey(preview.target) === previewKey,
    );
    if (existingPreview) {
      this.lifecycle.cancelAutoUnsubscribe(previewKey);
      if (
        existingPreview.getSnapshot().error === null &&
        isSameSource(existingPreview.source, source)
      ) {
        return existingPreview;
      }
      this.stopPreview(existingPreview);
    }

    const preview = new PreviewEntry(
      ++this.nextPreviewId,
      { filterIdx, pidIdx, direction },
      source,
      this.dependencies,
    );
    this.previews.set(preview.previewId, preview);
    void preview.start(filterName);
    return preview;
  }

  public stopPreview(preview: PreviewEntry): void {
    this.previews.delete(preview.previewId);
    preview.stop();
  }

  public releasePreview(preview: PreviewEntry): void {
    this.lifecycle.scheduleAutoUnsubscribe(toPreviewKey(preview.target), () =>
      this.stopPreview(preview),
    );
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
    this.lifecycle.cleanup();
    this.previews.forEach((preview) => preview.close());
    this.previews.clear();
  }
}
