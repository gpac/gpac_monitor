// GPAC CodecID name for AVC/H.264 (gf_codecid_file_ext, part before '|').
const AVC_CODEC_ID = '264';

function toHexByte(byte: number): string {
  return byte.toString(16).padStart(2, '0');
}

function decodeBase64(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

// avcC bytes 1-3 = profile, profile compatibility, level.
export function buildAvcCodecString(avcc: Uint8Array): string | null {
  if (avcc.length < 4) return null;
  return `avc1.${toHexByte(avcc[1])}${toHexByte(avcc[2])}${toHexByte(avcc[3])}`;
}

const AVCC_LENGTH_SIZE = 4;

// True when an AVCC access unit holds a coded slice (NAL types 1-5); malformed data counts as one.
export function hasPictureSlice(avccBytes: Uint8Array): boolean {
  let offset = 0;
  while (offset + AVCC_LENGTH_SIZE < avccBytes.length) {
    const nalLength =
      ((avccBytes[offset] << 24) |
        (avccBytes[offset + 1] << 16) |
        (avccBytes[offset + 2] << 8) |
        avccBytes[offset + 3]) >>>
      0;
    const nalStart = offset + AVCC_LENGTH_SIZE;
    if (nalLength === 0 || nalStart + nalLength > avccBytes.length) return true;
    const nalType = avccBytes[nalStart] & 0x1f;
    if (nalType >= 1 && nalType <= 5) return true;
    offset = nalStart + nalLength;
  }
  return offset !== avccBytes.length;
}

// Returns a browser-supported decoder config, or null when the preview must use PNG.
export async function resolveWebCodecsConfig(
  codec: string,
  decoderConfigBase64: string | null | undefined,
): Promise<VideoDecoderConfig | null> {
  if (typeof VideoDecoder === 'undefined' || !VideoDecoder) return null;
  if (codec !== AVC_CODEC_ID || !decoderConfigBase64) return null;
  try {
    const description = decodeBase64(decoderConfigBase64);
    const codecString = buildAvcCodecString(description);
    if (!codecString) return null;
    const config: VideoDecoderConfig = {
      codec: codecString,
      description,
      optimizeForLatency: true,
    };
    const support = await VideoDecoder.isConfigSupported(config);
    return support.supported ? config : null;
  } catch {
    return null;
  }
}
