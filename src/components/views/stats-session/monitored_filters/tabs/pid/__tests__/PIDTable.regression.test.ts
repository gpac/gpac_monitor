import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

const source = readFileSync(resolve(__dirname, '../PIDTable.tsx'), 'utf-8');

describe('PIDTable sticky overlap regression', () => {
  it('wrapper div has no overflow-hidden (breaks position:sticky on thead)', () => {
    expect(source).not.toMatch(/bg-monitor-app[^"]*overflow-hidden/);
  });

  it('thead has no sticky class (was broken by overflow-hidden parent, caused scroll-over on sub-tabs)', () => {
    expect(source).not.toMatch(/<thead[^>]*sticky/);
  });
});
