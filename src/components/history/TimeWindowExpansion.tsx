import { memo } from 'react';
import { LuTimer } from 'react-icons/lu';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { formatTimestamp, formatTime, formatMMSS } from '@/utils/formatting';
import { useTimeWindow } from './useTimeWindow';
import type { SessionInfo } from '@/services/historyService/sessionFileReader/types';

interface TimeWindowExpansionProps {
  session: SessionInfo;
  loading: boolean;
  onConfirm: (fromUs: number, toUs: number) => void;
  onCancel: () => void;
}

const TimeWindowExpansion = memo(
  ({ session, loading, onConfirm, onCancel }: TimeWindowExpansionProps) => {
    const durationUs = (session.endUs ?? 0) - (session.startUs ?? 0);
    const {
      range,
      fromText,
      toText,
      absoluteFromUs,
      absoluteToUs,
      handleSliderChange,
      handleFromChange,
      handleToChange,
      handleFromBlur,
      handleToBlur,
    } = useTimeWindow(session);

    return (
      <div className="animate-in fade-in slide-in-from-top-2 duration-150 px-4 py-4 space-y-4">
        <div className="flex items-center gap-2">
          <LuTimer className="w-4 h-4 text-violet-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-[#E6EDF3]">
              {formatTimestamp(session.sessionId)}
            </p>
            <p className="text-xs text-[#8B949E]">
              {formatTime(durationUs)} · Local file
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-[#8B949E]">Time range selection</p>
          <div className="flex items-center gap-2 text-xs text-[#8B949E]">
            <span className="w-10 shrink-0">{formatMMSS(0)}</span>
            <Slider
              min={0}
              max={durationUs}
              step={1_000_000}
              value={range}
              onValueChange={handleSliderChange}
              className="flex-1"
            />
            <span className="w-10 shrink-0 text-right">
              {formatMMSS(durationUs)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Input
              value={fromText}
              onChange={(event) => handleFromChange(event.target.value)}
              onBlur={handleFromBlur}
              className="h-8 text-sm text-center bg-[#11161C] border-[#1F2A36]"
            />
            <span className="text-[#8B949E] text-xs shrink-0">→</span>
            <Input
              value={toText}
              onChange={(event) => handleToChange(event.target.value)}
              onBlur={handleToBlur}
              className="h-8 text-sm text-center bg-[#11161C] border-[#1F2A36]"
            />
          </div>
        </div>

        <div className="border-t border-[#1F2A36] pt-3 space-y-2">
          <Button
            className="w-full h-9 rounded-md bg-violet-700 hover:bg-violet-600 text-white shadow-[0_0_8px_0px_rgba(124,58,237,0.35)] hover:shadow-[0_0_14px_0px_rgba(124,58,237,0.55)] transition-shadow"
            onClick={() => onConfirm(absoluteFromUs, absoluteToUs)}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner className="w-3.5 h-3.5 mr-2" />
                Loading…
              </>
            ) : (
              'Expand Time Window'
            )}
          </Button>
          <Button
            variant="ghost"
            className="w-full h-8 text-[#8B949E] hover:text-white hover:bg-white/5"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  },
);

export default TimeWindowExpansion;
