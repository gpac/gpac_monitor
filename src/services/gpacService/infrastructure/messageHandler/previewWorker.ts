import PreviewDecoderWorker from '@/workers/previewDecoderWorker?worker&inline';
import type {
  PreviewWorkerMessage,
  PreviewWorkerResponse,
} from '@/workers/previewDecoderWorker';

// Main-thread side of the preview decoder: the worker owns the VideoDecoder, frames come back by transfer.
export class PreviewWorker {
  private closed = false;

  private constructor(
    private readonly worker: Worker,
    private readonly onFrame: (frame: VideoFrame) => void,
    private readonly onError: (error: unknown) => void,
  ) {
    worker.onmessage = (event: MessageEvent<PreviewWorkerResponse>) =>
      this.handleResponse(event.data);
    worker.onerror = (event) => this.fail(event.message);
  }

  public static open(
    config: VideoDecoderConfig,
    filterIdx: number,
    onFrame: (frame: VideoFrame) => void,
    onError: (error: unknown) => void,
  ): PreviewWorker | null {
    try {
      const worker = new PreviewDecoderWorker({ name: 'previewDecoderWorker' });
      const previewWorker = new PreviewWorker(worker, onFrame, onError);
      previewWorker.post({ type: 'open', config, filterIdx });
      return previewWorker;
    } catch (error) {
      console.warn('[Preview] WebCodecs worker unavailable', error);
      return null;
    }
  }

  // Transfers the WS message buffer to the worker: no copy, the buffer is unusable here afterwards.
  public decodePacket(dataView: DataView): void {
    if (this.closed) return;
    this.post(
      {
        type: 'packet',
        buffer: dataView.buffer as ArrayBuffer,
        byteOffset: dataView.byteOffset,
        byteLength: dataView.byteLength,
      },
      [dataView.buffer as ArrayBuffer],
    );
  }

  public close(): void {
    if (this.closed) return;
    this.closed = true;
    this.post({ type: 'close' });
  }

  private handleResponse(response: PreviewWorkerResponse): void {
    if (response.type === 'error') {
      this.fail(response.message);
      return;
    }
    try {
      if (!this.closed) this.onFrame(response.frame);
    } finally {
      response.frame.close();
    }
  }

  private fail(error: unknown): void {
    if (this.closed) return;
    this.onError(error);
  }

  private post(
    message: PreviewWorkerMessage,
    transfer: Transferable[] = [],
  ): void {
    this.worker.postMessage(message, transfer);
  }
}
