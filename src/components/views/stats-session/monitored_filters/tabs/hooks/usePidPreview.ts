import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { gpacService } from '@/services/gpacService/gpacService';
import type { PreviewHandlerState } from '@/services/gpacService/infrastructure/messageHandler/preview/previewHandler';

export function usePidPreview(
  filterIdx: number,
  pidIdx: number,
  variant: 'input' | 'output',
  filterType: string,
  codec: string,
  decoderConfig: string | null | undefined,
  canvasRef: RefObject<HTMLCanvasElement>,
): PreviewHandlerState {
  const [state, setState] = useState<PreviewHandlerState>(() => ({
    filterIdx,
    pidIdx,
    loading: true,
    error: null,
  }));

  useEffect(() => {
    const preview = gpacService.requestPidPreview(
      filterIdx,
      pidIdx,
      variant,
      filterType,
      { codec, decoderConfig },
    );
    let tileWidth = 0;
    let tileHeight = 0;
    const resizeObserver = new ResizeObserver(([entry]) => {
      tileWidth = entry.contentRect.width * window.devicePixelRatio;
      tileHeight = entry.contentRect.height * window.devicePixelRatio;
    });
    if (canvasRef.current) resizeObserver.observe(canvasRef.current);
    preview.setFrameListener((frame) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const scale =
        tileWidth > 0 && tileHeight > 0
          ? Math.min(
              1,
              tileWidth / frame.displayWidth,
              tileHeight / frame.displayHeight,
            )
          : 1;
      const drawWidth = Math.max(1, Math.round(frame.displayWidth * scale));
      const drawHeight = Math.max(1, Math.round(frame.displayHeight * scale));
      if (canvas.width !== drawWidth) {
        canvas.width = drawWidth;
      }
      if (canvas.height !== drawHeight) {
        canvas.height = drawHeight;
      }
      canvas.getContext('2d')?.drawImage(frame, 0, 0, drawWidth, drawHeight);
    });
    const unsubscribe = preview.subscribe(
      (data) => {
        if (data) setState(data);
      },
      { immediate: true, debounce: 0 },
    );
    return () => {
      unsubscribe();
      resizeObserver.disconnect();
      gpacService.releasePidPreview(preview);
    };
  }, [filterIdx, pidIdx, variant, filterType, codec, decoderConfig, canvasRef]);

  return state;
}
