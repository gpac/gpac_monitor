import { useEffect, useState } from 'react';
import { gpacService } from '@/services/gpacService/gpacService';
import type { PreviewHandlerState } from '@/services/gpacService/infrastructure/messageHandler/previewHandler';

export function usePidPreview(filterIdx: number, filterType: string): PreviewHandlerState {
  const [state, setState] = useState<PreviewHandlerState>(() =>
    gpacService.preview.getSnapshot(),
  );

  useEffect(() => {
    gpacService.requestPidPreview(filterIdx, filterType);
    const unsubscribe = gpacService.preview.subscribe(
      (data) => { if (data) setState(data); },
      { immediate: true },
    );
    return () => {
      unsubscribe();
      gpacService.stopPidPreview(filterIdx);
    };
  }, [filterIdx, filterType]);

  return state;
}
