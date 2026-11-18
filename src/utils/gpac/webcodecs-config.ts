import {
  buildAv1CodecString,
  buildHevcCodecString,
  toHexByte,
} from './webcodecs-codec-strings';

// Keys are GPAC CodecID names (gf_codecid_file_ext, part before '|').
const CODEC_STRING_BUILDERS = new Map<
  string,
  (decoderConfig: Uint8Array) => string | null
>([
  ['264', buildAvcCodecString],
  ['hvc', buildHevcCodecString],
  ['av1', buildAv1CodecString],
]);

export function isPreviewableCodec(codec: string): boolean {
  return CODEC_STRING_BUILDERS.has(codec);
}

// A PID without a `codec` value stays offered.
export function canPreview(codec: string | null | undefined): boolean {
  return codec == null || isPreviewableCodec(codec);
}

export function canPreviewWithConfig(
  codec: string | null | undefined,
  decoderConfig: string | null | undefined,
): boolean {
  return canPreview(codec) && Boolean(decoderConfig);
}

function decodeBase64(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

// avcC bytes 1-3 = profile, profile compatibility, level.
export function buildAvcCodecString(avcc: Uint8Array): string | null {
  if (avcc.length < 4) return null;
  return `avc1.${toHexByte(avcc[1])}${toHexByte(avcc[2])}${toHexByte(avcc[3])}`;
}

function isAvcPictureNal(nalHeader: number): boolean {
  const nalType = nalHeader & 0x1f;
  return nalType >= 1 && nalType <= 5;
}

function isHevcPictureNal(nalHeader: number): boolean {
  const nalType = (nalHeader >> 1) & 0x3f;
  return nalType <= 9 || (nalType >= 16 && nalType <= 21);
}

const AVCC_LENGTH_SIZE = 4;

// True when a length-prefixed access unit holds a coded picture NAL of its codec; malformed data counts as one.
export function hasPictureSlice(
  avccBytes: Uint8Array,
  codecString = 'avc1',
): boolean {
  const isPictureNal = codecString.startsWith('hvc1')
    ? isHevcPictureNal
    : isAvcPictureNal;
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
    if (isPictureNal(avccBytes[nalStart])) return true;
    offset = nalStart + nalLength;
  }
  return offset !== avccBytes.length;
}

// Annex B separates NAL units with start codes (00 00 01 or 00 00 00 01); AVCC prefixes their length.
export function isAnnexB(bytes: Uint8Array): boolean {
  return (
    bytes[0] === 0 &&
    bytes[1] === 0 &&
    (bytes[2] === 1 || (bytes[2] === 0 && bytes[3] === 1))
  );
}

// Index of the next 00 00 01 from `from`, or the end of the buffer.
function nextStartCode(bytes: Uint8Array, from: number): number {
  for (let index = from; index + 2 < bytes.length; index++) {
    if (
      bytes[index] === 0 &&
      bytes[index + 1] === 0 &&
      bytes[index + 2] === 1
    ) {
      return index;
    }
  }
  return bytes.length;
}

// Splits on start codes, then writes each NAL as 4-byte length + bytes.
export function annexBToAvcc(bytes: Uint8Array): Uint8Array {
  const nalUnits: Uint8Array[] = [];
  let nalStart = nextStartCode(bytes, 0) + 3;
  while (nalStart < bytes.length) {
    const nextStart = nextStartCode(bytes, nalStart);
    // The leading 00 of a 4-byte start code is not part of the previous NAL.
    const nalEnd =
      nextStart < bytes.length && bytes[nextStart - 1] === 0
        ? nextStart - 1
        : nextStart;
    nalUnits.push(bytes.subarray(nalStart, nalEnd));
    nalStart = nextStart + 3;
  }
  const avccBytes = new Uint8Array(
    nalUnits.reduce(
      (sum, nalUnit) => sum + AVCC_LENGTH_SIZE + nalUnit.length,
      0,
    ),
  );
  const view = new DataView(avccBytes.buffer);
  let offset = 0;
  for (const nalUnit of nalUnits) {
    view.setUint32(offset, nalUnit.length);
    avccBytes.set(nalUnit, offset + AVCC_LENGTH_SIZE);
    offset += AVCC_LENGTH_SIZE + nalUnit.length;
  }
  return avccBytes;
}

// Returns a browser-supported decoder config, or null when the preview cannot be decoded.
export async function resolveWebCodecsConfig(
  codec: string,
  decoderConfigBase64: string | null | undefined,
): Promise<VideoDecoderConfig | null> {
  if (typeof VideoDecoder === 'undefined') return null;
  const buildCodecString = CODEC_STRING_BUILDERS.get(codec);
  if (!buildCodecString || !decoderConfigBase64) return null;
  try {
    const description = decodeBase64(decoderConfigBase64);
    const codecString = buildCodecString(description);
    if (!codecString) return null;
    const config: VideoDecoderConfig = {
      codec: codecString,
      description,
      optimizeForLatency: true,
    };
    const support = await VideoDecoder.isConfigSupported(config);
    return support.supported ? config : null;
  } catch (error) {
    console.warn('WebCodecs configuration failed:', error);
    return null;
  }
}
