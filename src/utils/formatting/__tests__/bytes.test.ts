import { describe, it, expect } from 'vitest';
import { formatBytes } from '../bytes';

describe('formatBytes', () => {
  it('returns "0 B" for zero', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formats bytes below 1 KiB as B', () => {
    expect(formatBytes(512)).toBe('512 B');
  });

  it('formats 1024 bytes as 1 KiB', () => {
    expect(formatBytes(1024)).toBe('1 KiB');
  });

  it('formats 1024 * 1024 bytes as 1 MiB', () => {
    expect(formatBytes(1024 * 1024)).toBe('1 MiB');
  });

  it('formats 1024^3 bytes as 1 GiB', () => {
    expect(formatBytes(1024 ** 3)).toBe('1 GiB');
  });

  it('formats 51_518_908 bytes as 49.13 MiB', () => {
    expect(formatBytes(51_518_908)).toBe('49.13 MiB');
  });
});
