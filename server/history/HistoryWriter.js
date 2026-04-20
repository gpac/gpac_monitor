import * as std from 'std';
import * as os from 'os';
import { ChunkStream } from './helpers/ChunkStream.js';

const CHUNK_DURATION_US = 10 * 1000 * 1000;
const MAX_LOG_PER_CHUNK = 5000;

function HistoryWriter(historyDir, sessionId) {
    const baseDir = historyDir || 'history';
    const id = sessionId || String(Date.now());
    const dir = `${baseDir}/${id}`;
    const chunksDir = `${dir}/chunks`;
    const logsDir = `${dir}/logs`;
    const checkpointsDir = `${dir}/checkpoints`;

    this.sessionId = id;
    this.sessionDir = dir;
    this.snapshotPath = `${dir}/snapshot.json`;

    this._initialized = false;
    this._events = null;
    this._logs = null;
    this._sessionStartUs = null;
    this._lastEventUs = null;
    this._checkpoints = [];

    this._init = function() {
        if (this._initialized) return;
        this._initialized = true;
        try { os.mkdir(baseDir); } catch (_e) {}
        try { os.mkdir(dir); } catch (_e) {}
        try { os.mkdir(chunksDir); } catch (_e) {}
        try { os.mkdir(logsDir); } catch (_e) {}
        try { os.mkdir(checkpointsDir); } catch (_e) {}
        print(`[HistoryWriter] Recording session ${id} to ${dir}/`);
        this._events = new ChunkStream(chunksDir, 'chunk', CHUNK_DURATION_US);
        this._logs = new ChunkStream(logsDir, 'logs', CHUNK_DURATION_US, MAX_LOG_PER_CHUNK);
    };

    this._updateTimestamps = function(tsUs) {
        if (this._sessionStartUs === null) this._sessionStartUs = tsUs;
        this._lastEventUs = tsUs;
    };

    this._writeManifest = function() {
        const manifest = {
            version: 1,
            startUs: this._sessionStartUs,
            endUs: this._lastEventUs,
            chunkDurationUs: CHUNK_DURATION_US,
            chunkCount: this._events ? this._events.getChunkCount() : 1,
            snapshot: 'snapshot.json',
            checkpoints: this._checkpoints,
            logChunks: this._logs ? this._logs.getAllChunks() : [],
        };
        const manifestFile = std.open(`${dir}/manifest.json`, 'w');
        if (!manifestFile) { print(`[HistoryWriter] Failed to write manifest`); return; }
        manifestFile.puts(JSON.stringify(manifest) + '\n');
        manifestFile.close();
    };

    this.writeSnapshot = function(obj) {
        this._init();
        const snapshotFile = std.open(this.snapshotPath, 'w');
        if (!snapshotFile) { print(`[HistoryWriter] Failed to write snapshot`); return; }
        snapshotFile.puts(JSON.stringify(obj) + '\n');
        snapshotFile.close();
    };

    this.writeLog = function(jsonString, tsUs) {
        this._init();
        this._updateTimestamps(tsUs);
        if (this._logs.write(jsonString, tsUs)) this._writeManifest();
    };

    this.writeEvent = function(jsonString, tsUs) {
        this._init();
        this._updateTimestamps(tsUs);
        const rotated = this._events.write(jsonString, tsUs);
        if (rotated) this._writeManifest();
        return rotated;
    };

    this.writeCheckpoint = function(chunkIndex, obj) {
        const padded = String(chunkIndex).padStart(4, '0');
        const file = `checkpoints/cp_${padded}.json`;
        const cpFile = std.open(`${dir}/${file}`, 'w');
        if (!cpFile) { print(`[HistoryWriter] Failed to write checkpoint ${file}`); return; }
        cpFile.puts(JSON.stringify(obj) + '\n');
        cpFile.close();
        this._checkpoints.push({ chunkIndex, file });
        this._writeManifest();
    };

    this.getCurrentChunkIndex = function() {
        return this._events ? this._events._index : 0;
    };

    this.close = function() {
        this._writeManifest();
        if (this._events) this._events.close();
        if (this._logs) this._logs.close();
        const doneFile = std.open(`${dir}/done`, 'w');
        if (doneFile) doneFile.close();
    };
}

export { HistoryWriter };
