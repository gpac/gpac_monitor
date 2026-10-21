import { useCallback, useState } from 'react';

type PreviewDirection = 'input' | 'output';

const togglePidIdx = (openPidIdxs: number[], pidIdx: number) =>
  openPidIdxs.includes(pidIdx)
    ? openPidIdxs.filter((openPidIdx) => openPidIdx !== pidIdx)
    : [...openPidIdxs, pidIdx];

export const useOpenPreviews = () => {
  const [openPreviews, setOpenPreviews] = useState<
    Record<PreviewDirection, number[]>
  >({ input: [], output: [] });

  const toggleInputPreview = useCallback((pidIdx: number) => {
    setOpenPreviews((current) => ({
      ...current,
      input: togglePidIdx(current.input, pidIdx),
    }));
  }, []);

  const toggleOutputPreview = useCallback((pidIdx: number) => {
    setOpenPreviews((current) => ({
      ...current,
      output: togglePidIdx(current.output, pidIdx),
    }));
  }, []);

  return { openPreviews, toggleInputPreview, toggleOutputPreview };
};
