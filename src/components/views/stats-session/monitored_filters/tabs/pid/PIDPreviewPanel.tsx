import { memo, useRef } from 'react';
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
    const { error } = usePidPreview(
      filterIdx,
      pidIdx,
      variant,
      filterType,
      codec,
      decoderConfig,
      canvasRef,
    );

    const frameBoxStyle =
      width && height
        ? { aspectRatio: `${width} / ${height}` }
        : { width: '16rem' };

    return (
      <div className="flex flex-col gap-1.5">
        <div className="text-xs font-medium text-muted-foreground">
          Preview
        </div>
        {error ? (
          <div
            role="alert"
            className="flex h-64 items-center justify-center p-4 text-center font-ui text-xs text-danger bg-monitor-panel border border-white/10"
            style={frameBoxStyle}
          >
            {error}
          </div>
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
