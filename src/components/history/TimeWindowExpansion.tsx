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
          <LuTimer className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-white">
              {formatTimestamp(session.sessionId)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatTime(durationUs)} · Local file
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-gray-500">Time range selection</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
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
              className="h-8 text-sm text-center text-gray-300 bg-[#11161C] border-[#1F2A36]"
            />
            <span className="text-gray-500 text-xs shrink-0">→</span>
            <Input
              value={toText}
              onChange={(event) => handleToChange(event.target.value)}
              onBlur={handleToBlur}
              className="h-8 text-sm text-center text-gray-300 bg-[#11161C] border-[#1F2A36]"
            />
          </div>
        </div>

        <div className="border-t border-[#1F2A36] pt-3 space-y-2">
          <Button
            className="w-full h-9 rounded-md text-white/90 transition-opacity hover:opacity-90"
            style={{
              background:
                'linear-gradient(180deg, rgba(124,58,237,0.9) 0%, rgba(109,40,217,0.9) 100%)',
            }}
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
            className="w-full h-8 text-gray-500 hover:text-gray-300 hover:bg-white/5"
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
