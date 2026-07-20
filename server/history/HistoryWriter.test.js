import { describe, it, expect, vi } from 'vitest';
import * as std from 'std';
import * as os from 'os';
import { HistoryWriter } from './HistoryWriter.js';

describe('HistoryWriter journal index', () => {
  it('has no journal pointer when no fact was ever recorded', () => {
    const writer = new HistoryWriter('test-history');

    expect(writer._getJournalPointer()).toBeUndefined();
  });

  it('summarizes recorded facts into a journal pointer with error/warning counts', () => {
    const writer = new HistoryWriter('test-history');

    writer.recordJournalFact(1523463, 1);
    writer.recordJournalFact(1523478, 2);
    writer.recordJournalFact(1527685, 1);

    expect(writer._getJournalPointer()).toEqual({
      file: 'journal_index.json',
      format: 'columnar-delta-v1',
      eventCount: 3,
      errorCount: 2,
      warningCount: 1,
    });
  });
});

describe('HistoryWriter close order', () => {
  it('closes event/log streams and writes the manifest before marking the session done', () => {
    const writer = new HistoryWriter('test-history');
    writer.writeEvent('{"a":1}', 1000);

    const order = [];
    const originalEventsClose = writer._events.close.bind(writer._events);
    const originalLogsClose = writer._logs.close.bind(writer._logs);
    const originalWriteManifest = writer._writeManifest.bind(writer);

    writer._events.close = () => { order.push('events.close'); originalEventsClose(); };
    writer._logs.close = () => { order.push('logs.close'); originalLogsClose(); };
    writer._writeManifest = () => { order.push('writeManifest'); originalWriteManifest(); };

    const openSpy = vi.spyOn(std, 'open');
    writer.close();

    expect(order).toEqual(['events.close', 'logs.close', 'writeManifest']);

    const donePathCalls = openSpy.mock.calls.filter(([path]) => path.endsWith('/done'));
    const manifestTmpPathCalls = openSpy.mock.calls.filter(([path]) => path.endsWith('/manifest.json.tmp'));
    expect(donePathCalls.length).toBe(1);
    expect(manifestTmpPathCalls.length).toBe(1);
    expect(openSpy.mock.invocationCallOrder[openSpy.mock.calls.indexOf(manifestTmpPathCalls[0])])
      .toBeLessThan(openSpy.mock.invocationCallOrder[openSpy.mock.calls.indexOf(donePathCalls[0])]);

    openSpy.mockRestore();
  });
});

describe('HistoryWriter atomic manifest writes', () => {
  it('writes the manifest to a .tmp file then renames it atomically', () => {
    const writer = new HistoryWriter('test-history', 'sess1');
    writer.writeEvent('{"a":1}', 1000);

    const openSpy = vi.spyOn(std, 'open');
    const renameSpy = vi.spyOn(os, 'rename');

    writer._writeManifest();

    const tmpOpenCall = openSpy.mock.calls.find(([path]) => path.endsWith('manifest.json.tmp'));
    expect(tmpOpenCall).toBeDefined();

    const renameCall = renameSpy.mock.calls.find(([, dest]) => dest.endsWith('manifest.json'));
    expect(renameCall).toBeDefined();
    expect(renameCall[0]).toBe(`${renameCall[1]}.tmp`);

    openSpy.mockRestore();
    renameSpy.mockRestore();
  });
});
