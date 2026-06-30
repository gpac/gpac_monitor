import { memo } from 'react';
import { usePidPreview } from '../hooks/usePidPreview';

interface PIDPreviewPanelProps {
  filterIdx: number;
  filterType: string;
}

const PIDPreviewPanel = memo(({ filterIdx, filterType }: PIDPreviewPanelProps) => {
  const { dataBase64, error } = usePidPreview(filterIdx, filterType);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-xs font-medium text-muted-foreground">Preview · 128×128</div>
      {error ? (
        <div className="text-xs text-destructive w-32">{error}</div>
      ) : dataBase64 ? (
        <img src={`data:image/png;base64,${dataBase64}`} width={128} height={128} alt="PID preview" />
      ) : (
        <div className="h-32 w-32 bg-monitor-panel border border-white/10" />
      )}
    </div>
  );
});

PIDPreviewPanel.displayName = 'PIDPreviewPanel';
export default PIDPreviewPanel;
