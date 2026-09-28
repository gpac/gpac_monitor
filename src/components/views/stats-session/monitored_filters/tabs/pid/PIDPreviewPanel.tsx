import { memo, useEffect, useState } from 'react';
import { usePidPreview } from '../hooks/usePidPreview';

interface PIDPreviewPanelProps {
  filterIdx: number;
  filterType: string;
  pidIdx: number;
  variant: 'input' | 'output';
}

const PIDPreviewPanel = memo(
  ({ filterIdx, filterType, pidIdx, variant }: PIDPreviewPanelProps) => {
    const { frame, error } = usePidPreview(
      filterIdx,
      pidIdx,
      variant,
      filterType,
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

    return (
      <div className="flex flex-col gap-1.5">
        <div className="text-xs font-medium text-muted-foreground">
          {frameSize ? `Preview · ${frameSize}` : 'Preview'}
        </div>
        {error ? (
          <div className="text-xs text-destructive w-64">{error}</div>
        ) : previewUrl ? (
          <img
            src={previewUrl}
            alt="PID preview"
            onLoad={(event) =>
              setFrameSize(
                `${event.currentTarget.naturalWidth}×${event.currentTarget.naturalHeight}`,
              )
            }
            className="block"
          />
        ) : (
          <div className="h-64 w-64 bg-monitor-panel border border-white/10" />
        )}
      </div>
    );
  },
);

PIDPreviewPanel.displayName = 'PIDPreviewPanel';
export default PIDPreviewPanel;
