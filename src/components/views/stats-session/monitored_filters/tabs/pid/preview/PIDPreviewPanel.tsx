import { memo, useRef } from 'react';
import { LuTriangleAlert, LuX } from 'react-icons/lu';
import { Spinner } from '@/components/ui/spinner';
import { CustomTooltip } from '@/components/ui/tooltip';
import { usePidPreview } from '../../hooks/usePidPreview';

const KEYFRAMES_ONLY_HINT =
  'Only keyframes are displayed. This preview does not represent real-time playback.';

const FRAME_BOX_STYLE = {
  aspectRatio: '16 / 9',
  width: '100%',
  maxHeight: '20rem',
};

interface PIDPreviewPanelProps {
  filterIdx: number;
  filterType: string;
  pidIdx: number;
  variant: 'input' | 'output';
  codec: string;
  decoderConfig: string | null | undefined;
  title: string;
  subtitle: string;
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
    subtitle,
    onClose,
  }: PIDPreviewPanelProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { error, loading, keyframesOnly } = usePidPreview(
      filterIdx,
      pidIdx,
      variant,
      filterType,
      codec,
      decoderConfig,
      canvasRef,
    );

    return (
      <div className="flex flex-col overflow-hidden rounded border border-white/10 bg-monitor-panel">
        <div className="flex items-start justify-between gap-2 border-b border-white/10 px-2 py-1.5">
          <div className="flex min-w-0 flex-col">
            <span
              className="truncate text-[13px] font-semibold text-monitor-text-primary"
              title={title}
            >
              {title}
            </span>
            <span
              className="truncate text-[11px] text-muted-foreground"
              title={subtitle}
            >
              {subtitle}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {keyframesOnly && !loading && (
              <CustomTooltip content={KEYFRAMES_ONLY_HINT} side="bottom">
                <span className="flex items-start gap-1 whitespace-nowrap border border-amber-500/70 bg-black/80 px-2 py-0.5 font-ui text-[9px] font-semibold uppercase text-amber-400">
                  <LuTriangleAlert className="h-3 w-3" />
                  Keyframes
                </span>
              </CustomTooltip>
            )}
            <button
              onClick={() => onClose(pidIdx)}
              className="rounded px-1 py-0.5 text-gray-300 hover:bg-gray-700/80"
              title="Close preview"
              aria-label="Close preview"
            >
              <LuX className="h-4 w-4" />
            </button>
          </div>
        </div>
        {error ? (
          <div
            role="alert"
            className="flex items-center justify-center p-4 text-center font-ui text-xs text-danger"
            style={FRAME_BOX_STYLE}
          >
            {error}
          </div>
        ) : (
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="block object-contain"
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
