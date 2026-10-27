import * as std from 'std';
import * as os from 'os';

/**
 * IndexDraft - append-only JSONL draft of root index entries, so a killed GPAC
 * still leaves its timeline markers on disk. Lines are buffered; flush() is
 * driven by the caller's ~1s write cadence, never per entry (GPAC thread).
 * @param {string} path
 */
function IndexDraft(path) {
    this._file = null;
    this._pending = false;

    this.append = function(entry) {
        if (!this._file) {
            this._file = std.open(path, 'a');
            if (!this._file) {
                print(`[IndexDraft] Failed to open ${path}`);
                return;
            }
        }
        this._file.puts(JSON.stringify(entry) + '\n');
        this._pending = true;
    };

    this.flush = function() {
        if (!this._pending) return;
        this._file.flush();
        this._pending = false;
    };

    // Called once the archive indexes are written: the draft content is now redundant.
    this.clear = function() {
        if (this._file) {
            this._file.close();
            this._file = null;
        }
        this._pending = false;
        os.remove(path);
    };
}

export { IndexDraft };
