import type { PIDproperties } from '@/types/domain/gpac/filter-stats';
import type { GpacStreamType } from '@/types/domain/gpac/stream-types';

/**
 * Hydrate named format fields on ipids from their `properties` delta object.
 * Server no longer sends these as named fields on ipids —
 * they are available only in the delta-sent `properties` map.
 */
export function hydrateIpidFields(
  ipids: Record<string, PIDproperties>,
): void {
  for (const k of Object.keys(ipids)) {
    const pid = ipids[k];
    const props = pid.properties;
    if (!props) continue;

    pid.codec = (props['CodecID']?.value as string) ?? pid.codec;
    pid.type = (props['StreamType']?.value as GpacStreamType) ?? pid.type;
    pid.width = (props['Width']?.value as number) ?? pid.width;
    pid.height = (props['Height']?.value as number) ?? pid.height;
    pid.pixelformat = (props['PixelFormat']?.value as string) ?? pid.pixelformat;
    pid.timescale = (props['Timescale']?.value as number) ?? pid.timescale;
    pid.samplerate = (props['SampleRate']?.value as number) ?? pid.samplerate;
    pid.channels = (props['Channels']?.value as number) ?? pid.channels;
    pid.bitrate = (props['Bitrate']?.value as number) ?? pid.bitrate;
  }
}
