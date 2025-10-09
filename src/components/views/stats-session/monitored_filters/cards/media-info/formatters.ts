import { TimeFraction } from '@/types/domain/gpac/model';
import { formatTime } from '@/utils/helper';

/**
 * Formats frames per second from TimeFraction
 */
export const formatFPS = (fps?: TimeFraction): string => {
  if (
    !fps ||
    typeof fps !== 'object' ||
    !('num' in fps) ||
    !('den' in fps) ||
    fps.den === 0
  ) {
    return 'N/A';
  }
  return `${(fps.num / fps.den).toFixed(2)} fps`;
};

/**
 * Formats bitrate value
 */
export const formatBitrate = (value: number): string => {
  return `${(value / 1000).toFixed(0)} kb/s`;
};

/**
 * Formats sample rate value
 */
export const formatSamplerate = (value: number): string => {
  return `${(value / 1000).toFixed(1)} kHz`;
};

/**
 * Formats timescale value
 */
export const formatTimescale = (value: number): string => {
  return value.toLocaleString();
};

/**
 * Format parameter value for display based on parameter key
 */
export const formatMultimediaValue = (key: string, value: unknown): string => {
  if (value === undefined || value === null) return 'N/A';

  const formatters: Record<string, (val: any) => string> = {
    fps: (val) => formatFPS(val as TimeFraction),
    bitrate: (val) =>
      typeof val === 'number' ? formatBitrate(val) : String(val),
    duration: (val) =>
      typeof val === 'number' ? formatTime(val) : String(val),
    samplerate: (val) =>
      typeof val === 'number' ? formatSamplerate(val) : String(val),
    timescale: (val) =>
      typeof val === 'number' ? formatTimescale(val) : String(val),
  };

  return formatters[key]?.(value) ?? String(value);
};

/**
 * Gets appropriate badge variant for codec name
 */
export const getCodecBadgeVariant = (
  codec: string | undefined,
): 'default' | 'secondary' | 'outline' => {
  if (!codec) return 'outline';
  const lowerCodec = codec.toLowerCase();
  if (lowerCodec.includes('h264') || lowerCodec.includes('avc'))
    return 'default';
  if (lowerCodec.includes('h265') || lowerCodec.includes('hevc'))
    return 'secondary';
  if (lowerCodec.includes('av1')) return 'default';
  return 'outline';
};
