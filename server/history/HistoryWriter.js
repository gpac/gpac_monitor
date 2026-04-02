import * as std from 'std';
import * as os from 'os';

const CHUNK_SIZE = 500;

function HistoryWriter(historyDir, sessionId) {
    const baseDir = historyDir || 'history';
    const id = sessionId || String(Date.now());
    const dir = `${baseDir}/${id}`;
    const chunksDir = `${dir}/chunks`;

    this.sessionId = id;
    this.sessionDir = dir;
    this.snapshotPath = `${dir}/snapshot.json`;

    this._initialized = false;
    this._currentChunkFile = null;
    this._currentChunkIndex = 0;
    this._currentChunkCount = 0;
    this._currentChunkStartUs = null;
    this._lastEventUs = null;
    this._sessionStartUs = null;

    this._chunks = [];

    this._init = function() {
        if (this._initialized) return;
        this._initialized = true;
        try { os.mkdir(baseDir); } catch (_e) {}
        try { os.mkdir(dir); } catch (_e) {}
        try { os.mkdir(chunksDir); } catch (_e) {}
        print(`[HistoryWriter] Recording session ${id} to ${dir}/`);
        this._openNewChunk();
    };

    this._chunkPath = function(index) {
        const paddedIndex = String(index).padStart(4, '0');
        return `${chunksDir}/chunk_${paddedIndex}.jsonl`;
    };

    this._openNewChunk = function() {
        if (this._currentChunkFile) {
            this._currentChunkFile.close();
            this._currentChunkFile = null;
        }
        const chunkPath = this._chunkPath(this._currentChunkIndex);
        this._currentChunkFile = std.open(chunkPath, 'a');
        if (!this._currentChunkFile) {
            print(`[HistoryWriter] Failed to open chunk ${chunkPath}`);
        }
        this._currentChunkCount = 0;
        this._currentChunkStartUs = null;
    };

    this._rotateChunkIfNeeded = function() {
        if (this._currentChunkCount < CHUNK_SIZE) return;
        this._chunks.push({
            file: `chunks/chunk_${String(this._currentChunkIndex).padStart(4, '0')}.jsonl`,
            fromUs: this._currentChunkStartUs,
            toUs: this._lastEventUs,
            count: this._currentChunkCount,
        });
        this._currentChunkIndex++;
        this._openNewChunk();
    };

    this._writeManifest = function() {
        const allChunks = this._chunks.slice();
        if (this._currentChunkCount > 0) {
            allChunks.push({
                file: `chunks/chunk_${String(this._currentChunkIndex).padStart(4, '0')}.jsonl`,
                fromUs: this._currentChunkStartUs,
                toUs: this._lastEventUs,
                count: this._currentChunkCount,
            });
        }
        const manifest = {
            version: 1,
            startUs: this._sessionStartUs,
            endUs: this._lastEventUs,
            chunks: allChunks,
        };
        const manifestFile = std.open(`${dir}/manifest.json`, 'w');
        if (!manifestFile) { print(`[HistoryWriter] Failed to write manifest`); return; }
        manifestFile.puts(JSON.stringify(manifest) + '\n');
        manifestFile.close();
    };

    this._logsFile = null;
    this._logsPath = `${dir}/logs.jsonl`;

    this.writeSnapshot = function(obj) {
        this._init();
        const snapshotFile = std.open(this.snapshotPath, 'w');
        if (!snapshotFile) { print(`[HistoryWriter] Failed to write snapshot`); return; }
        snapshotFile.puts(JSON.stringify(obj) + '\n');
        snapshotFile.close();
    };

    this.writeLog = function(jsonString) {
        this._init();
        if (!this._logsFile) {
            this._logsFile = std.open(this._logsPath, 'a');
            if (!this._logsFile) { print('[HistoryWriter] Failed to open logs.jsonl'); return; }
        }
        this._logsFile.puts(jsonString + '\n');
        this._logsFile.flush();
    };

    this.writeEvent = function(jsonString, tsUs) {
        this._init();
        if (!this._currentChunkFile) return;

        this._rotateChunkIfNeeded();

        if (this._currentChunkStartUs === null) {
            this._currentChunkStartUs = tsUs;
        }
        if (this._sessionStartUs === null) {
            this._sessionStartUs = tsUs;
        }
        this._lastEventUs = tsUs;

        this._currentChunkFile.puts(jsonString + '\n');
        this._currentChunkFile.flush();
        this._currentChunkCount++;

        this._writeManifest();
    };

    this.close = function() {
        if (this._currentChunkFile) {
            this._currentChunkFile.close();
            this._currentChunkFile = null;
        }
        if (this._logsFile) {
            this._logsFile.close();
            this._logsFile = null;
        }
        this._writeManifest();
        const doneFile = std.open(`${dir}/done`, 'w');
        if (doneFile) doneFile.close();
    };
}

export { HistoryWriter };
