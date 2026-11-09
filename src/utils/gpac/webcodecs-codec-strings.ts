export function toHexByte(byte: number): string {
  return byte.toString(16).padStart(2, '0');
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
