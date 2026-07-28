import { describe, it, expect } from 'vitest';
import { LocalFileSessionFileReader } from '../LocalFileSessionFileReader';

function makeMockFile(path: string, content: string): File {
  return {
    webkitRelativePath: path,
    name: path.split('/').pop()!,
    size: content.length,
    text: () => Promise.resolve(content),
  } as unknown as File;
}

const SNAPSHOT_CONTENT = '{}';

describe('LocalFileSessionFileReader.listSessions', () => {
  it('populates startUs/endUs when manifest is present', async () => {
    const manifest = JSON.stringify({ startUs: 1_000_000, endUs: 5_000_000 });
    const reader = new LocalFileSessionFileReader([
      makeMockFile('history/1234567890/snapshot.json', SNAPSHOT_CONTENT),
      makeMockFile('history/1234567890/manifest.json', manifest),
    ]);

    const sessions = await reader.listSessions();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].startUs).toBe(1_000_000);
    expect(sessions[0].endUs).toBe(5_000_000);
  });

  it('leaves startUs/endUs undefined when no manifest', async () => {
    const reader = new LocalFileSessionFileReader([
      makeMockFile('history/9999999999/snapshot.json', SNAPSHOT_CONTENT),
    ]);

    const sessions = await reader.listSessions();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].startUs).toBeUndefined();
    expect(sessions[0].endUs).toBeUndefined();
  });

  it('leaves startUs/endUs undefined and keeps session when manifest is malformed', async () => {
    const reader = new LocalFileSessionFileReader([
      makeMockFile('history/5555555555/snapshot.json', SNAPSHOT_CONTENT),
      makeMockFile('history/5555555555/manifest.json', 'not valid json {{{'),
    ]);

    const sessions = await reader.listSessions();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].sessionId).toBe('5555555555');
    expect(sessions[0].startUs).toBeUndefined();
    expect(sessions[0].endUs).toBeUndefined();
  });

  it('handles mixed sessions independently', async () => {
    const manifest = JSON.stringify({ startUs: 2_000_000, endUs: 8_000_000 });
    const reader = new LocalFileSessionFileReader([
      makeMockFile('history/1111111111/snapshot.json', SNAPSHOT_CONTENT),
      makeMockFile('history/1111111111/manifest.json', manifest),
      makeMockFile('history/2222222222/snapshot.json', SNAPSHOT_CONTENT),
    ]);

    const sessions = await reader.listSessions();

    expect(sessions).toHaveLength(2);
    const withManifest = sessions.find(
      (session) => session.sessionId === '1111111111',
    );
    const withoutManifest = sessions.find(
      (session) => session.sessionId === '2222222222',
    );

    expect(withManifest?.startUs).toBe(2_000_000);
    expect(withManifest?.endUs).toBe(8_000_000);
    expect(withoutManifest?.startUs).toBeUndefined();
    expect(withoutManifest?.endUs).toBeUndefined();
  });
});
