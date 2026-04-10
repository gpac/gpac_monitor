import * as std from 'std';
import * as os from 'os';
import { ChunkStream } from './helpers/ChunkStream.js';

const CHUNK_SIZE = 500;
const LOG_SIZE = 1000;

function HistoryWriter(historyDir, sessionId) {
    const baseDir = historyDir || 'history';
    const id = sessionId || String(Date.now());
    const dir = `${baseDir}/${id}`;
    const chunksDir = `${dir}/chunks`;
    const logsDir = `${dir}/logs`;

    this.sessionId = id;
    this.sessionDir = dir;
    this.snapshotPath = `${dir}/snapshot.json`;

    this._initialized = false;
    this._events = null;
    this._logs = null;
    this._sessionStartUs = null;
    this._lastEventUs = null;

    this._init = function() {
        if (this._initialized) return;
        this._initialized = true;
        try { os.mkdir(baseDir); } catch (_e) {}
        try { os.mkdir(dir); } catch (_e) {}
        try { os.mkdir(chunksDir); } catch (_e) {}
        try { os.mkdir(logsDir); } catch (_e) {}
        print(`[HistoryWriter] Recording session ${id} to ${dir}/`);
        this._events = new ChunkStream(chunksDir, 'chunk', CHUNK_SIZE);
        this._logs = new ChunkStream(logsDir, 'logs', LOG_SIZE);
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
            chunks: this._events ? this._events.getAllChunks() : [],
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
        if (this._events.write(jsonString, tsUs)) this._writeManifest();
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
