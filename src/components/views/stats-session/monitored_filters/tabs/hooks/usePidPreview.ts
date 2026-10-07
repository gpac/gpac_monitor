import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { gpacService } from '@/services/gpacService/gpacService';
import type { PreviewHandlerState } from '@/services/gpacService/infrastructure/messageHandler/previewHandler';

export function usePidPreview(
  filterIdx: number,
  pidIdx: number,
  variant: 'input' | 'output',
  filterType: string,
  codec: string,
  decoderConfig: string | null | undefined,
  canvasRef: RefObject<HTMLCanvasElement>,
): PreviewHandlerState {
  const [state, setState] = useState<PreviewHandlerState>(() =>
    gpacService.preview.getSnapshot(),
  );

  useEffect(() => {
    gpacService.preview.setFrameListener((frame) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (canvas.width !== frame.displayWidth) {
        canvas.width = frame.displayWidth;
      }
      if (canvas.height !== frame.displayHeight) {
        canvas.height = frame.displayHeight;
      }
      canvas.getContext('2d')?.drawImage(frame, 0, 0);
    });
    return () => gpacService.preview.setFrameListener(null);
  }, [canvasRef]);

  useEffect(() => {
    void gpacService.requestPidPreview(filterIdx, pidIdx, variant, filterType, {
      codec,
      decoderConfig,
    });
    const unsubscribe = gpacService.preview.subscribe(
      (data) => {
        if (data) setState(data);
      },
      { immediate: true, debounce: 0 },
    );
    return () => {
      unsubscribe();
      gpacService.stopPidPreview(filterIdx, pidIdx, variant);
    };
  }, [filterIdx, pidIdx, variant, filterType, codec, decoderConfig]);

  return state;
}
