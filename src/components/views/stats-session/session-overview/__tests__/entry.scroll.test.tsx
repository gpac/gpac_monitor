import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

const source = readFileSync(resolve(__dirname, '../entry.tsx'), 'utf-8');

describe('OverviewEntry — detach auto-scroll regression', () => {
  it('scrolls the <main> scroll container (grid app-shell), not window/body which no longer scrolls', () => {
    const effect =
      source.match(/if \(isDetached\)[\s\S]*?\}\);\n {6}\}/)?.[0] ?? '';
    expect(effect).toContain("document.querySelector('main')");
    expect(effect).not.toContain('window.scrollTo');
  });
});
