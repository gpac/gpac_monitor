import { LuFilm, LuMusic, LuSettings } from 'react-icons/lu';
import { IconType } from 'react-icons';
import { TabPIDData } from '@/types/ui';

/**
 * Get resolution string from PID data
 */
export const getResolution = (pidData: TabPIDData): string | null => {
  if (pidData.width && pidData.height) {
    return `${pidData.width}x${pidData.height}`;
  }
  return null;
};

/**
 * Determine media icon based on PID data
 */
export const getMediaIcon = (pidData: TabPIDData): IconType => {
  if (pidData.width && pidData.height) return LuFilm;
  if (pidData.samplerate || pidData.channels) return LuMusic;
  return LuSettings;
};

/**
 * Group PID parameters by category
 */
export const groupParameters = (pidData: TabPIDData) => {
  const videoParams = {
    codec: pidData.codec,
    resolution: getResolution(pidData),
    pixelformat: pidData.pixelformat,
  };

  const audioParams = {
    codec: pidData.codec,
    samplerate: pidData.samplerate,
    channels: pidData.channels,
  };

  const technicalParams = {
    type: pidData.type,
    timescale: pidData.timescale,
  };

  return { videoParams, audioParams, technicalParams };
};

/**
 * Check if parameter group has any meaningful data
 */
export const hasValidData = (params: Record<string, any>): boolean => {
  return Object.values(params).some((val) => val !== undefined && val !== null);
};
