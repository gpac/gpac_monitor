import { describe, it, expect } from 'vitest';
import { buildAv1CodecString } from '../webcodecs-codec-strings';

function decodeBase64(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

describe('buildAv1CodecString', () => {
  it('builds the codec string of a real av1C (testsuite video.av1)', () => {
    const av1c = decodeBase64('gQAMAAoKAAAAAzf/7//MAg==');
    expect(buildAv1CodecString(av1c)).toBe('av01.0.00M.08');
  });

  it('rejects a config without the av1C marker', () => {
    expect(buildAv1CodecString(new Uint8Array([0x01, 0, 0x0c, 0]))).toBeNull();
  });

  it('rejects a reserved profile', () => {
    expect(
      buildAv1CodecString(new Uint8Array([0x81, 0x60, 0x0c, 0])),
    ).toBeNull();
  });

  it('rejects 12-bit outside profile 2 high bit depth', () => {
    expect(
      buildAv1CodecString(new Uint8Array([0x81, 0x00, 0x2c, 0])),
    ).toBeNull();
  });
});
