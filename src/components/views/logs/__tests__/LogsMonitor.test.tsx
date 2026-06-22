import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

const source = readFileSync(resolve(__dirname, '../LogsMonitor.tsx'), 'utf-8');

describe('LogsMonitor — horizontal scroll regression', () => {
  it('locks the Virtuoso scroller to overflowX hidden so wide log lines never show a horizontal scrollbar', () => {
    const virtuosoStyle = source.match(/style=\{\{[\s\S]*?\}\}/)?.[0] ?? '';
    expect(virtuosoStyle).toContain("overflowX: 'hidden'");
  });
});
