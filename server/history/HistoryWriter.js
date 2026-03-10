import * as std from 'std';
import * as os from 'os';

/**
 * HistoryWriter - Append-only JSONL writer for session history
 *
 * Writes each message as a single JSON line, flushed immediately
 * for crash safety. The JSONL format is the contract between
 * server-side writing and client-side reading.
 *
 * Format: one JSON object per line, same shape as WS messages
 * e.g. {"message":"filters","filters":[...]}
 * e.g. {"message":"session_stats","stats":[...]}
 */
function HistoryWriter(historyDir) {
    const dir = historyDir || 'history';
    const ts = Date.now();
    const path = `${dir}/${ts}.jsonl`;

    // Ensure directory exists
    try { os.mkdir(dir); } catch (_e) { /* already exists */ }

    this.file = std.open(path, 'a');
    this.path = path;

    if (!this.file) {
        print(`[HistoryWriter] Failed to open ${path}`);
    } else {
        print(`[HistoryWriter] Recording to ${path}`);
    }

    this.write = function(jsonString) {
        if (!this.file) return;
        this.file.puts(jsonString + '\n');
        this.file.flush();
    };

    this.close = function() {
        if (this.file) {
            this.file.close();
            this.file = null;
        }
    };
}

export { HistoryWriter };
