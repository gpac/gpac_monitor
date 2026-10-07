import { useEffect, useState } from 'react';
import { gpacService } from '@/services/gpacService/gpacService';
import type { PreviewHandlerState } from '@/services/gpacService/infrastructure/messageHandler/previewHandler';

export function usePidPreview(
  filterIdx: number,
  pidIdx: number,
  variant: 'input' | 'output',
  filterType: string,
  codec: string,
  decoderConfig: string | null | undefined,
): PreviewHandlerState {
  const [state, setState] = useState<PreviewHandlerState>(() =>
    gpacService.preview.getSnapshot(),
  );

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
