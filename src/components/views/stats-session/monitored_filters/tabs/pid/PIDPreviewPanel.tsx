import { memo, useEffect, useRef, useState } from 'react';
import { usePidPreview } from '../hooks/usePidPreview';

interface PIDPreviewPanelProps {
  filterIdx: number;
  filterType: string;
  pidIdx: number;
  variant: 'input' | 'output';
  width: number | null;
  height: number | null;
  codec: string;
  decoderConfig: string | null | undefined;
}

const PIDPreviewPanel = memo(
  ({
    filterIdx,
    filterType,
    pidIdx,
    variant,
    width,
    height,
    codec,
    decoderConfig,
  }: PIDPreviewPanelProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { frame, error } = usePidPreview(
      filterIdx,
      pidIdx,
      variant,
      filterType,
      codec,
      decoderConfig,
      canvasRef,
    );
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [frameSize, setFrameSize] = useState<string | null>(null);

    useEffect(() => {
      if (!frame) {
        setPreviewUrl(null);
        setFrameSize(null);
        return;
      }
      const objectUrl = URL.createObjectURL(
        new Blob([frame.png], { type: 'image/png' }),
      );
      setPreviewUrl(objectUrl);
      // Revoking on cleanup does not blank the image already on screen: revocation only
      // prevents future loads of that URL, a decoded image stays painted.
      return () => URL.revokeObjectURL(objectUrl);
    }, [frame]);

    const frameBoxStyle =
      width && height
        ? { aspectRatio: `${width} / ${height}` }
        : { width: '16rem' };

    return (
      <div className="flex flex-col gap-1.5">
        <div className="text-xs font-medium text-muted-foreground">
          {frameSize ? `Preview · ${frameSize}` : 'Preview'}
        </div>
        {error ? (
          <div className="h-64 text-xs text-destructive" style={frameBoxStyle}>
            {error}
          </div>
        ) : previewUrl ? (
          <img
            src={previewUrl}
            alt="PID preview"
            onLoad={(event) =>
              setFrameSize(
                `${event.currentTarget.naturalWidth}×${event.currentTarget.naturalHeight}`,
              )
            }
            className="block h-64 object-contain"
            style={frameBoxStyle}
          />
        ) : (
          <canvas
            ref={canvasRef}
            className="block h-64 object-contain bg-monitor-panel border border-white/10"
            style={frameBoxStyle}
          />
        )}
      </div>
    );
  },
);

PIDPreviewPanel.displayName = 'PIDPreviewPanel';
export default PIDPreviewPanel;
