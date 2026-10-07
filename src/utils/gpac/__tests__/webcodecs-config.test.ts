import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  buildAvcCodecString,
  resolveWebCodecsConfig,
} from '../webcodecs-config';

// avcC of server/scripts/input.mp4 (Main profile, level 3.0), as sent by PidDataCollector.
const INPUT_MP4_AVCC_BASE64 =
  'AU1AHv/hABhnTUAe2gKA9sBEAAADAAQAAAMAyDxYuoABAARo7zyA';

function stubVideoDecoder(isConfigSupported: () => Promise<unknown>) {
  vi.stubGlobal('VideoDecoder', { isConfigSupported });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('buildAvcCodecString', () => {
  it('builds avc1.PPCCLL from avcC bytes 1-3', () => {
    const avcc = Uint8Array.from(atob(INPUT_MP4_AVCC_BASE64), (char) =>
      char.charCodeAt(0),
    );
    expect(buildAvcCodecString(avcc)).toBe('avc1.4d401e');
  });

  it('returns null for an avcC shorter than 4 bytes', () => {
    expect(buildAvcCodecString(new Uint8Array([1, 77]))).toBeNull();
  });
});

describe('resolveWebCodecsConfig', () => {
  it('returns the decoder config for a supported AVC PID', async () => {
    stubVideoDecoder(async () => ({ supported: true }));
    const config = await resolveWebCodecsConfig('264', INPUT_MP4_AVCC_BASE64);
    expect(config?.codec).toBe('avc1.4d401e');
    expect(config?.description).toBeInstanceOf(Uint8Array);
  });

  it('returns null when the decoder config is absent', async () => {
    stubVideoDecoder(async () => ({ supported: true }));
    expect(await resolveWebCodecsConfig('264', null)).toBeNull();
    expect(await resolveWebCodecsConfig('264', undefined)).toBeNull();
  });

  it('returns null when VideoDecoder is absent', async () => {
    vi.stubGlobal('VideoDecoder', undefined);
    expect(
      await resolveWebCodecsConfig('264', INPUT_MP4_AVCC_BASE64),
    ).toBeNull();
  });

  it('returns null for a non-AVC codec', async () => {
    stubVideoDecoder(async () => ({ supported: true }));
    expect(
      await resolveWebCodecsConfig('raw', INPUT_MP4_AVCC_BASE64),
    ).toBeNull();
  });

  it('returns null when the browser refuses or fails the config check', async () => {
    stubVideoDecoder(async () => ({ supported: false }));
    expect(
      await resolveWebCodecsConfig('264', INPUT_MP4_AVCC_BASE64),
    ).toBeNull();
    stubVideoDecoder(async () => {
      throw new TypeError('invalid config');
    });
    expect(
      await resolveWebCodecsConfig('264', INPUT_MP4_AVCC_BASE64),
    ).toBeNull();
  });
});
