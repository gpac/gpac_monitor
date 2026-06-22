import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

const source = readFileSync(
  resolve(__dirname, '../DashboardLayout.tsx'),
  'utf-8',
);

describe('DashboardLayout app-shell — scroll ownership regression', () => {
  it('owns the scroll on <main> (overflow-y-auto), never on the page body', () => {
    const mainTag = source.match(/<main[\s\S]*?>/)?.[0] ?? '';
    expect(mainTag).toContain('overflow-y-auto');
  });

  it('clips the middle row so body never scrolls and the header stays pinned', () => {
    expect(source).toContain('flex relative min-h-0 overflow-hidden');
  });

  it('uses a CSS grid shell, not the old fixed-header height hack', () => {
    expect(source).toContain('grid-rows-[auto_1fr]');
    expect(source).not.toContain('h-[calc(100vh-4rem)]');
  });
});
