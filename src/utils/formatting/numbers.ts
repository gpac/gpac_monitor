/**
 * Number formatting utilities
 */

export const formatNumber = (num: number): string => {
  if (num < 1000) return num.toString();
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
  if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
  return (num / 1000000000).toFixed(1) + 'G';
};

export const formatBitrate = (bitrate: number | undefined): string => {
  if (!bitrate) return '0 b/s';
  if (bitrate >= 1000000000) return `${(bitrate / 1000000000).toFixed(2)} Gb/s`;
  if (bitrate >= 1000000) return `${(bitrate / 1000000).toFixed(2)} Mb/s`;
  if (bitrate >= 1000) return `${(bitrate / 1000).toFixed(2)} Kb/s`;
  return `${bitrate.toFixed(0)} b/s`;
};

export const roundNumber = (num: number, decimals: number = 2): number => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

export const formatPacketRate = (
  rate: number | undefined,
  decimals: number = 2,
): string => {
  if (!rate) return '0 pck/s';
  if (rate >= 1000000) return `${(rate / 1000000).toFixed(decimals)} Mpck/s`;
  if (rate >= 1000) return `${(rate / 1000).toFixed(decimals)} Kpck/s`;
  return `${rate.toFixed(0)} pck/s`;
};

export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};
