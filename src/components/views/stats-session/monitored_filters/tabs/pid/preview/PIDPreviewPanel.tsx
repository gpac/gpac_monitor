import { memo, useRef } from 'react';
import { LuX } from 'react-icons/lu';
import { Spinner } from '@/components/ui/spinner';
import { usePidPreview } from '../../hooks/usePidPreview';

const FRAME_BOX_STYLE = { aspectRatio: '16 / 9', width: '100%' };

interface PIDPreviewPanelProps {
  filterIdx: number;
  filterType: string;
  pidIdx: number;
  variant: 'input' | 'output';
  codec: string;
  decoderConfig: string | null | undefined;
  title: string;
  onClose: (pidIdx: number) => void;
}

const PIDPreviewPanel = memo(
  ({
    filterIdx,
    filterType,
    pidIdx,
    variant,
    codec,
    decoderConfig,
    title,
    onClose,
  }: PIDPreviewPanelProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { error, loading } = usePidPreview(
      filterIdx,
      pidIdx,
      variant,
      filterType,
      codec,
      decoderConfig,
      canvasRef,
    );

    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
          <span className="min-w-0 truncate" title={title}>
            {title}
          </span>
          <button
            onClick={() => onClose(pidIdx)}
            className="rounded px-1 text-gray-300 hover:bg-gray-700/80"
            title="Close preview"
            aria-label="Close preview"
          >
            <LuX className="h-3.5 w-3.5" />
          </button>
        </div>
        {error ? (
          <div
            role="alert"
            className="flex items-center justify-center p-4 text-center font-ui text-xs text-danger bg-monitor-panel border border-white/10"
            style={FRAME_BOX_STYLE}
          >
            {error}
          </div>
        ) : (
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="block object-contain bg-monitor-panel border border-white/10"
              style={FRAME_BOX_STYLE}
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center gap-2 font-ui text-xs text-muted-foreground">
                <Spinner size="sm" />
                Waiting for keyframe…
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
);

PIDPreviewPanel.displayName = 'PIDPreviewPanel';
export default PIDPreviewPanel;
