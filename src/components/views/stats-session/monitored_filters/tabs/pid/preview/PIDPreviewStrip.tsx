import { memo } from 'react';
import type { PIDWithIndex } from '../../../../types';
import PIDPreviewPanel from './PIDPreviewPanel';
import { buildPIDDisplayLabel } from '../utils/pidLabel';

interface PIDPreviewStripProps {
  pids: PIDWithIndex[];
  previewPidIdxs: number[];
  filterIdx: number;
  filterType: string;
  variant: 'input' | 'output';
  onClosePreview: (pidIdx: number) => void;
}

const SINGLE_PREVIEW_GRID_STYLE = { gridTemplateColumns: 'minmax(0, 1fr)' };
const MULTI_PREVIEW_GRID_STYLE = {
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
};

const PIDPreviewStrip = memo(
  ({
    pids,
    previewPidIdxs,
    filterIdx,
    filterType,
    variant,
    onClosePreview,
  }: PIDPreviewStripProps) => {
    const previewPids = pids.filter((pid) =>
      previewPidIdxs.includes(pid.pidIdx),
    );
    if (previewPids.length === 0) return null;

    return (
      <section className="flex flex-col gap-1.5">
        <div className="text-[0.714rem] font-medium uppercase tracking-wide text-muted-foreground">
          Previews ({previewPids.length})
        </div>
        <div
          className="grid gap-2"
          style={
            previewPids.length === 1
              ? SINGLE_PREVIEW_GRID_STYLE
              : MULTI_PREVIEW_GRID_STYLE
          }
        >
          {previewPids.map((pid) => (
            <PIDPreviewPanel
              key={pid.pidIdx}
              filterIdx={filterIdx}
              filterType={filterType}
              pidIdx={pid.pidIdx}
              variant={variant}
              codec={pid.codec}
              decoderConfig={pid.decoderConfig}
              title={buildPIDDisplayLabel(pid)}
              onClose={onClosePreview}
            />
          ))}
        </div>
      </section>
    );
  },
);

PIDPreviewStrip.displayName = 'PIDPreviewStrip';

export default PIDPreviewStrip;
