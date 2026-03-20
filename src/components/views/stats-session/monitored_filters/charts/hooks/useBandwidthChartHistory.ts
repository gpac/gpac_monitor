import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { formatBytes } from '@/utils/formatting';
import { RootState } from '@/shared/store';
import {
  selectFilterUploadData,
  selectFilterDownloadData,
} from '@/shared/store/selectors';

interface UseBandwidthChartHistoryOptions {
  filterId: string;
  type: 'upload' | 'download';
}

/**
 * Reads bandwidth data from the same Redux slice as live mode.
 * Data is populated by bandwidthReplay.ts during history event replay.
 */
export const useBandwidthChartHistory = ({
  filterId,
  type,
}: UseBandwidthChartHistoryOptions) => {
  const dataPoints = useSelector((state: RootState) =>
    type === 'upload'
      ? selectFilterUploadData(state, filterId)
      : selectFilterDownloadData(state, filterId),
  );

  const formatBandwidth = useCallback(
    (value: number): string => `${formatBytes(value)}/s`,
    [],
  );

  const tooltipFormatter = useCallback(
    (value: number | string | Array<number | string>) => {
      if (typeof value === 'number')
        return [formatBandwidth(value), 'Bandwidth'];
      return [value as string, 'Bandwidth'];
    },
    [formatBandwidth],
  );

  return { dataPoints, formatBandwidth, tooltipFormatter };
};
