import { memo, useRef } from 'react';
import { LuX } from 'react-icons/lu';
import { usePidPreview } from '../../hooks/usePidPreview';

interface PIDPreviewPanelProps {
  filterIdx: number;
  filterType: string;
  pidIdx: number;
  variant: 'input' | 'output';
  width: number | null;
  height: number | null;
  codec: string;
  decoderConfig: string | null | undefined;
  title?: string;
  onClose?: (pidIdx: number) => void;
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
    title = 'Preview',
    onClose,
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

    const isTile = onClose !== undefined;
    const aspectRatio = width && height ? `${width} / ${height}` : '16 / 9';
    const frameBoxStyle = isTile
      ? { aspectRatio, width: '100%' }
      : width && height
        ? { aspectRatio }
        : { width: '16rem' };
    const frameHeightClass = isTile ? '' : 'h-64';

    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
          <span className="min-w-0 truncate" title={title}>
            {title}
          </span>
          {onClose && (
            <button
              onClick={() => onClose(pidIdx)}
              className="rounded px-1 text-gray-300 hover:bg-gray-700/80"
              title="Close preview"
              aria-label="Close preview"
            >
              <LuX className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {error ? (
          <div
            role="alert"
            className={`flex ${frameHeightClass} items-center justify-center p-4 text-center font-ui text-xs text-danger bg-monitor-panel border border-white/10`}
            style={frameBoxStyle}
          >
            {error}
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className={`block ${frameHeightClass} object-contain bg-monitor-panel border border-white/10`}
            style={frameBoxStyle}
          />
        )}
      </div>
    );
  },
);

PIDPreviewPanel.displayName = 'PIDPreviewPanel';
export default PIDPreviewPanel;
