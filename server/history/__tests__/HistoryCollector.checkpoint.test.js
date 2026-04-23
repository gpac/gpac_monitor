const memfs = {};
const CHUNK_US = 10_000_000;

vi.mock('std', () => ({
    open: (path) => {
        let buf = '';
        return { puts: (s) => { buf += s; }, close: () => { memfs[path] = buf; } };
    },
}));
vi.mock('os', () => ({ mkdir: vi.fn() }));
vi.stubGlobal('print', () => {});

import { HistoryWriter } from '../HistoryWriter.js';

const SNAPSHOT = { version: 1, ts_us: 0, filters: [] };
const EVENT = JSON.stringify({ version: 1, message: 'filters', ts_us: 0 });

beforeEach(() => {
    Object.keys(memfs).forEach(k => delete memfs[k]);
});

function readManifest() {
    const key = Object.keys(memfs).find(k => k.endsWith('manifest.json'));
    if (!key) throw new Error('No manifest.json in memfs');
    return JSON.parse(memfs[key]);
}

function cpSummary(manifest) {
    return {
        snapshot: manifest.snapshot,
        chunkCount: manifest.chunkCount,
        checkpoints: manifest.checkpoints.map(({ chunkIndex, file }) => ({ chunkIndex, file })),
    };
}

describe('HistoryWriter — checkpoints', () => {
    it('Case 1: only chunk 0 → no checkpoint', () => {
        const writer = new HistoryWriter('h');
        writer.writeSnapshot(SNAPSHOT);
        writer.writeEvent(EVENT, 1000);
        writer.close();

        const manifest = readManifest();

        expect(manifest.checkpoints).toEqual([]);
        expect(manifest.snapshot).toBe('snapshot.json');
        expect(cpSummary(manifest)).toMatchSnapshot();
    });

    it('Case 2: rotation + checkpoint for chunk 1 → no checkpoint for chunk 0', () => {
        const writer = new HistoryWriter('h');
        writer.writeSnapshot(SNAPSHOT);
        writer.writeEvent(EVENT, 1000);

        // rotation chunk 0→1
        const rotated = writer.writeEvent(EVENT, CHUNK_US + 2000);
        expect(rotated).toBe(true);

        // checkpoint written for chunkIndex 1 (never for 0)
        writer.writeCheckpoint(1, { version: 1, ts_us: CHUNK_US + 2000 });
        writer.close();

        const manifest = readManifest();

        expect(manifest.checkpoints).toHaveLength(1);
        expect(manifest.checkpoints[0].chunkIndex).toBe(1);
        expect(manifest.checkpoints.some(cp => cp.chunkIndex === 0)).toBe(false);
        expect(cpSummary(manifest)).toMatchSnapshot();
    });

    it('Case 3: chunk 1 without useful event → no checkpoint', () => {
        const writer = new HistoryWriter('h');
        writer.writeSnapshot(SNAPSHOT);
        writer.writeEvent(EVENT, 1000);

        // rotation without checkpoint (non-useful chunk)
        writer.writeEvent(EVENT, CHUNK_US + 2000);
        writer.writeEvent(EVENT, CHUNK_US + 3000);
        writer.close();

        const manifest = readManifest();

        expect(manifest.checkpoints).toEqual([]);
    });

    it('Case 4: only one checkpoint per chunk even with multiple calls', () => {
        const writer = new HistoryWriter('h');
        writer.writeSnapshot(SNAPSHOT);
        writer.writeEvent(EVENT, 1000);

        // rotation chunk 0→1
        writer.writeEvent(EVENT, CHUNK_US + 2000);

        // only one checkpoint for chunk 1
        writer.writeCheckpoint(1, { version: 1, ts_us: CHUNK_US + 2000 });

        // rotation chunk 1→2
        writer.writeEvent(EVENT, CHUNK_US * 2 + 3000);
        writer.writeCheckpoint(2, { version: 1, ts_us: CHUNK_US * 2 + 3000 });
        writer.close();

        const manifest = readManifest();

        expect(manifest.checkpoints).toHaveLength(2);
        expect(manifest.checkpoints.map(cp => cp.chunkIndex)).toEqual([1, 2]);
        expect(cpSummary(manifest)).toMatchSnapshot();
    });
});

