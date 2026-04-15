import { useState, useCallback } from 'react';
import { formatMMSS, parseMMSS } from '@/utils/formatting';
import type { SessionInfo } from '@/services/historyService/sessionFileReader/types';

export interface TimeWindowState {
  range: [number, number];
  fromText: string;
  toText: string;
  absoluteFromUs: number;
  absoluteToUs: number;
  handleSliderChange: (values: number[]) => void;
  handleFromChange: (value: string) => void;
  handleToChange: (value: string) => void;
  handleFromBlur: () => void;
  handleToBlur: () => void;
}

export function useTimeWindow(session: SessionInfo): TimeWindowState {
  const startUs = session.startUs ?? 0;
  const durationUs = (session.endUs ?? 0) - startUs;

  const [range, setRange] = useState<[number, number]>([0, durationUs]);
  const [fromText, setFromText] = useState(() => formatMMSS(0));
  const [toText, setToText] = useState(() => formatMMSS(durationUs));

  const handleSliderChange = useCallback((values: number[]) => {
    const next: [number, number] = [values[0], values[1]];
    setRange(next);
    setFromText(formatMMSS(next[0]));
    setToText(formatMMSS(next[1]));
  }, []);

  const handleFromChange = useCallback((value: string) => {
    setFromText(value);
  }, []);

  const handleToChange = useCallback((value: string) => {
    setToText(value);
  }, []);

  const handleFromBlur = useCallback(() => {
    setRange((current) => {
      const parsed = parseMMSS(fromText, current[1]);
      if (parsed !== null) {
        setFromText(formatMMSS(parsed));
        return [parsed, current[1]];
      }
      setFromText(formatMMSS(current[0]));
      return current;
    });
  }, [fromText]);

  const handleToBlur = useCallback(() => {
    setRange((current) => {
      const parsed = parseMMSS(toText, durationUs);
      if (parsed !== null && parsed > current[0]) {
        setToText(formatMMSS(parsed));
        return [current[0], parsed];
      }
      setToText(formatMMSS(current[1]));
      return current;
    });
  }, [toText, durationUs]);

  return {
    range,
    fromText,
    toText,
    absoluteFromUs: startUs + range[0],
    absoluteToUs: startUs + range[1],
    handleSliderChange,
    handleFromChange,
    handleToChange,
    handleFromBlur,
    handleToBlur,
  };
}
