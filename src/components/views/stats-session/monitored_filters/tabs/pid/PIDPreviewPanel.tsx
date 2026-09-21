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
    const { frame, error } = usePidPreview(filterIdx, pidIdx, variant, filterType);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
      if (!frame) {
        setPreviewUrl(null);
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
          Preview · 128×128
        </div>
        {error ? (
          <div className="text-xs text-destructive w-32">{error}</div>
        ) : previewUrl ? (
          <img
            src={previewUrl}
            width={128}
            height={128}
            alt="PID preview"
            className="h-32 w-32 object-contain"
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
