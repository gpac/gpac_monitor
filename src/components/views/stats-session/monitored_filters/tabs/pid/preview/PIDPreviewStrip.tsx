import { memo } from 'react';
import type { FilterStatsResponse } from '@/types/domain/gpac/filter-stats';
import type { PIDWithIndex } from '../../../../types';
import PIDPreviewPanel from './PIDPreviewPanel';
import { buildPIDDisplayLabel } from '../utils/pidLabel';
import { useInputsTabData } from '../../hooks/useInputsTabData';
import { useOutputsTabData } from '../../hooks/useOutputsTabData';

interface PIDPreviewStripProps {
  filterData: FilterStatsResponse;
  filterType: string;
  inputPreviewPidIdxs: number[];
  outputPreviewPidIdxs: number[];
  onCloseInputPreview: (pidIdx: number) => void;
  onCloseOutputPreview: (pidIdx: number) => void;
}

interface PreviewTile {
  pid: PIDWithIndex;
  variant: 'input' | 'output';
}

const SINGLE_PREVIEW_GRID_STYLE = { gridTemplateColumns: 'minmax(0, 1fr)' };
const MULTI_PREVIEW_GRID_STYLE = {
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
};
const DIRECTION_PREFIX = { input: 'IN', output: 'OUT' } as const;

const PIDPreviewTiles = ({
  filterData,
  filterType,
  inputPreviewPidIdxs,
  outputPreviewPidIdxs,
  onCloseInputPreview,
  onCloseOutputPreview,
}: PIDPreviewStripProps) => {
  const { inputPidsWithIndices } = useInputsTabData(filterData);
  const { pidsWithIndices: outputPidsWithIndices } =
    useOutputsTabData(filterData);

  const previewTiles: PreviewTile[] = [
    ...inputPidsWithIndices
      .filter((pid) => inputPreviewPidIdxs.includes(pid.pidIdx))
      .map((pid) => ({ pid, variant: 'input' as const })),
    ...outputPidsWithIndices
      .filter((pid) => outputPreviewPidIdxs.includes(pid.pidIdx))
      .map((pid) => ({ pid, variant: 'output' as const })),
  ];
  if (previewTiles.length === 0) return null;

  return (
    <section className="flex flex-col gap-1.5">
      <div className="text-[0.714rem] font-medium uppercase tracking-wide text-muted-foreground">
        Previews ({previewTiles.length})
      </div>
      <div
        className="grid gap-2"
        style={
          previewTiles.length === 1
            ? SINGLE_PREVIEW_GRID_STYLE
            : MULTI_PREVIEW_GRID_STYLE
        }
      >
        {previewTiles.map(({ pid, variant }) => (
          <PIDPreviewPanel
            key={`${variant}-${pid.pidIdx}`}
            filterIdx={filterData.idx}
            filterType={filterType}
            pidIdx={pid.pidIdx}
            variant={variant}
            codec={pid.codec}
            decoderConfig={pid.decoderConfig}
            title={`${DIRECTION_PREFIX[variant]} · ${buildPIDDisplayLabel(pid)}`}
            onClose={
              variant === 'input' ? onCloseInputPreview : onCloseOutputPreview
            }
          />
        ))}
      </div>
    </section>
  );
};

const PIDPreviewStrip = memo((props: PIDPreviewStripProps) => {
  if (
    props.inputPreviewPidIdxs.length === 0 &&
    props.outputPreviewPidIdxs.length === 0
  )
    return null;
  return <PIDPreviewTiles {...props} />;
});

PIDPreviewStrip.displayName = 'PIDPreviewStrip';

export default PIDPreviewStrip;
