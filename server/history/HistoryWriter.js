import * as std from 'std';
import * as os from 'os';

/**
 * HistoryWriter - Writes session history to disk
 *
 * Lazy: directory and file are created only on first write.
 *
 * Directory structure:
 *   history/<session-id>/
 *     snapshot.json   — enriched initial state (written once)
 *     events.jsonl    — chronological WS-format messages + ts_us
 */
function HistoryWriter(historyDir, sessionId) {
    const baseDir = historyDir || 'history';
    const id = sessionId || String(Date.now());
    const dir = `${baseDir}/${id}`;

    this.sessionId = id;
    this.sessionDir = dir;
    this.snapshotPath = `${dir}/snapshot.json`;

    this._eventsFile = null;
    this._initialized = false;

    this._init = function() {
        if (this._initialized) return;
        this._initialized = true;
        try { os.mkdir(baseDir); } catch (_e) {}
        try { os.mkdir(dir); } catch (_e) {}
        this._eventsFile = std.open(`${dir}/events.jsonl`, 'a');
        if (!this._eventsFile) {
            print(`[HistoryWriter] Failed to open ${dir}/events.jsonl`);
        } else {
            print(`[HistoryWriter] Recording session ${id} to ${dir}/`);
        }
    };

    /** Write enriched snapshot (call once) */
    this.writeSnapshot = function(obj) {
        this._init();
        const f = std.open(this.snapshotPath, 'w');
        if (!f) { print(`[HistoryWriter] Failed to write snapshot`); return; }
        f.puts(JSON.stringify(obj) + '\n');
        f.close();
    };

    /** Append one WS-format event line */
    this.writeEvent = function(jsonString) {
        this._init();
        if (!this._eventsFile) return;
        this._eventsFile.puts(jsonString + '\n');
        this._eventsFile.flush();
    };

    this.close = function() {
        if (this._eventsFile) {
            this._eventsFile.close();
            this._eventsFile = null;
        }
    };
}

export { HistoryWriter };
