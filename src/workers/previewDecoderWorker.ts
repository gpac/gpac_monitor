import { PreviewDecoder } from '@/services/gpacService/infrastructure/messageHandler/previewDecoder';

export type PreviewWorkerMessage =
  | { type: 'open'; config: VideoDecoderConfig }
  | {
      type: 'packet';
      buffer: ArrayBuffer;
      byteOffset: number;
      byteLength: number;
    }
  | { type: 'close' };

export type PreviewWorkerResponse =
  | { type: 'frame'; frame: VideoFrame }
  | { type: 'error'; message: string };

let decoder: PreviewDecoder | null = null;

function postError(error: unknown): void {
  const response: PreviewWorkerResponse = {
    type: 'error',
    message: error instanceof Error ? error.message : String(error),
  };
  self.postMessage(response);
}

self.addEventListener(
  'message',
  (event: MessageEvent<PreviewWorkerMessage>) => {
    const message = event.data;
    if (message.type === 'open') {
      decoder = PreviewDecoder.open(
        message.config,
        (frame) => {
          const response: PreviewWorkerResponse = {
            type: 'frame',
            frame: frame.clone(),
          };
          self.postMessage(response, { transfer: [response.frame] });
        },
        postError,
      );
      if (!decoder) postError('WebCodecs decoder unavailable in worker');
      return;
    }
    if (message.type === 'packet') {
      decoder?.decodePacket(
        new DataView(message.buffer, message.byteOffset, message.byteLength),
      );
      return;
    }
    decoder?.close();
    decoder = null;
    self.close();
  },
);
