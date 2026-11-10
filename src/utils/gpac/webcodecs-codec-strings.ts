export function toHexByte(byte: number): string {
  return byte.toString(16).padStart(2, '0');
}

// av1C (AV1-ISOBMFF 2.3): byte 0 = marker + version 1; byte 1 = profile (3 bits) + level (5 bits);
// byte 2 = tier, high_bitdepth, twelve_bit flags in its top bits.
export function buildAv1CodecString(av1c: Uint8Array): string | null {
  if (av1c.length < 4 || av1c[0] !== 0x81) return null;
  const profile = av1c[1] >> 5;
  const levelIndex = av1c[1] & 0x1f;
  const highTier = (av1c[2] & 0x80) !== 0;
  const highBitDepth = (av1c[2] & 0x40) !== 0;
  const twelveBit = (av1c[2] & 0x20) !== 0;
  // AV1 spec: 3 profiles, levels 24-30 reserved (31 = max parameters),
  // tier only signalled from level 4.0, 12-bit only in profile 2.
  if (profile > 2) return null;
  if (levelIndex > 23 && levelIndex !== 31) return null;
  if (highTier && levelIndex < 8) return null;
  if (twelveBit && (!highBitDepth || profile !== 2)) return null;
  const level = levelIndex.toString().padStart(2, '0');
  const bitDepth = twelveBit ? '12' : highBitDepth ? '10' : '08';
  return `av01.${profile}.${level}${highTier ? 'H' : 'M'}.${bitDepth}`;
}

export function buildHevcCodecString(hvcc: Uint8Array): string | null {
  if (hvcc.length < 23 || hvcc[0] !== 1) return null;
  const profileSpace = ['', 'A', 'B', 'C'][hvcc[1] >> 6];
  const profileIdc = hvcc[1] & 0x1f;
  const tier = hvcc[1] & 0x20 ? 'H' : 'L';
  const compatibilityBits = Array.from(hvcc.subarray(2, 6), (byte) =>
    byte.toString(2).padStart(8, '0'),
  ).join('');
  const compatibility = parseInt(
    [...compatibilityBits].reverse().join(''),
    2,
  ).toString(16);
  const constraints = Array.from(hvcc.subarray(6, 12));
  while (constraints[constraints.length - 1] === 0) constraints.pop();
  return [
    'hvc1',
    `${profileSpace}${profileIdc}`,
    compatibility,
    `${tier}${hvcc[12]}`,
    ...constraints.map((byte) => toHexByte(byte)),
  ].join('.');
}
