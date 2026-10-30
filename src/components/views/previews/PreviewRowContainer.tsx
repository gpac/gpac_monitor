import React, { useCallback } from 'react';
import { useAppDispatch } from '@/shared/hooks';
import type { OpenPreviews } from '@/shared/store/widgets/types';
import { openPidPreview } from '@/shared/store/widgets/widgetsSlice';
import { useOpenPreviews } from '../stats-session/monitored_filters/tabs/hooks/useOpenPreviews';
import { PreviewRow } from './ui/PreviewRow';

const DIRECTION_LABEL = { input: 'Input', output: 'Output' } as const;

interface PreviewRowContainerProps {
  filterIdx: number;
  filterName: string;
  direction: keyof OpenPreviews;
  pidIdx: number;
  isOpen: boolean;
}

export const PreviewRowContainer = React.memo(
  ({
    filterIdx,
    filterName,
    direction,
    pidIdx,
    isOpen,
  }: PreviewRowContainerProps) => {
    const dispatch = useAppDispatch();
    const { toggleInputPreview, toggleOutputPreview } =
      useOpenPreviews(filterIdx);

    const handleOpen = useCallback(
      () =>
        dispatch(
          openPidPreview({
            filterIdx,
            name: filterName,
            pidIdx,
            variant: direction,
          }),
        ),
      [dispatch, filterIdx, filterName, pidIdx, direction],
    );

    const handleClose = useCallback(
      () =>
        direction === 'input'
          ? toggleInputPreview(pidIdx)
          : toggleOutputPreview(pidIdx),
      [direction, pidIdx, toggleInputPreview, toggleOutputPreview],
    );

    return (
      <PreviewRow
        label={`${DIRECTION_LABEL[direction]} · PID #${pidIdx}`}
        filterName={filterName}
        isOpen={isOpen}
        onOpen={handleOpen}
        onClose={handleClose}
      />
    );
  },
);

PreviewRowContainer.displayName = 'PreviewRowContainer';
