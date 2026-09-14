import { memo, useEffect, useRef } from 'react';
import { usePidPreview } from '../hooks/usePidPreview';

interface PIDPreviewPanelProps {
  filterIdx: number;
  filterType: string;
  pidIdx: number;
  variant: 'input' | 'output';
}

const PIDPreviewPanel = memo(
  ({ filterIdx, filterType, pidIdx, variant }: PIDPreviewPanelProps) => {
    const { frame, error } = usePidPreview(filterIdx, pidIdx, variant, filterType);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      if (!frame || !canvasRef.current) return;
      const context = canvasRef.current.getContext('2d');
      if (!context) return;
      const { pixels } = frame;
      if (pixels.length !== frame.width * frame.height * 4) return;
      context.putImageData(
        new ImageData(pixels, frame.width, frame.height),
        0,
        0,
      );
    }, [frame]);

    return (
      <div className="flex flex-col gap-1.5">
        <div className="text-xs font-medium text-muted-foreground">
          Preview · 128×128
        </div>
        {error ? (
          <div className="text-xs text-destructive w-32">{error}</div>
        ) : frame ? (
          <canvas
            ref={canvasRef}
            width={frame.width}
            height={frame.height}
            className="h-32 w-32"
          />
        ) : (
          <div className="h-32 w-32 bg-monitor-panel border border-white/10" />
        )}
      </div>
    );
  },
);

PIDPreviewPanel.displayName = 'PIDPreviewPanel';
export default PIDPreviewPanel;
