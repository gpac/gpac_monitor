import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { gpacService } from '@/services/gpacService/gpacService';
import { usePidPreview } from '../usePidPreview';

vi.mock('@/services/gpacService/gpacService', async () => {
  const { PreviewHandler } = await import(
    '@/services/gpacService/infrastructure/messageHandler/previewHandler'
  );
  const preview = new PreviewHandler({
    isConnected: () => true,
    send: async () => undefined,
    stopReconnection: () => undefined,
    markEndOfSession: () => undefined,
  });
  return {
    gpacService: {
      preview,
      requestPidPreview: vi.fn(),
      stopPidPreview: vi.fn(),
    },
  };
});

function makePvwfFrame(
  filterIdx: number,
  pidIdx: number,
  pngByteLength: number,
): DataView {
  const view = new DataView(new ArrayBuffer(12 + pngByteLength));
  view.setUint32(4, filterIdx, true);
  view.setUint32(8, pidIdx, true);
  return view;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('usePidPreview', () => {
  it('renders each frame when frames arrive every 100 ms', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => usePidPreview(5, 1, 'output', 'ffdec'));

    for (let frameNumber = 1; frameNumber <= 3; frameNumber++) {
      act(() => {
        gpacService.preview.handlePreviewFrame(
          makePvwfFrame(5, 1, frameNumber),
        );
        vi.advanceTimersByTime(100);
      });
      expect(result.current.frame?.png.length).toBe(frameNumber);
    }
  });
});
