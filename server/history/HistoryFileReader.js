import * as std from 'std';
import * as os from 'os';

const ALLOWED_FILES = ['snapshot.json', 'events.jsonl'];
const VALID_SESSION_ID = /^\d+$/;

/**
 * HistoryFileReader - Read-only access to history sessions
 *
 * Security: whitelist of allowed filenames, sessionId must be numeric,
 * all reads scoped to historyDir.
 */
function HistoryFileReader(historyDir) {
    const baseDir = historyDir || 'history';

    /** List available sessions with metadata */
    this.listSessions = function () {
        const sessions = [];
        const [entries, err] = os.readdir(baseDir);
        if (err) return sessions;

        for (const entry of entries) {
            if (!VALID_SESSION_ID.test(entry)) continue;
            const dir = `${baseDir}/${entry}`;
            const hasSnapshot = fileExists(`${dir}/snapshot.json`);
            const hasEvents = fileExists(`${dir}/events.jsonl`);
            if (!hasSnapshot && !hasEvents) continue;
            const sizeBytes = fileSize(`${dir}/events.jsonl`);
            const isComplete = fileExists(`${dir}/done`);
            sessions.push({ sessionId: entry, hasSnapshot, hasEvents, sizeBytes, isComplete });
        }
        sessions.sort((a, b) => Number(b.sessionId) - Number(a.sessionId));
        return sessions;
    };

    /** Read an allowed file from a session */
    this.readFile = function (sessionId, fileName) {
        if (!VALID_SESSION_ID.test(sessionId)) {
            return { ok: false, error: 'session_not_found', detail: `Invalid sessionId: ${sessionId}` };
        }
        if (!ALLOWED_FILES.includes(fileName)) {
            return { ok: false, error: 'file_not_allowed', detail: `File not allowed: ${fileName}` };
        }
        const path = `${baseDir}/${sessionId}/${fileName}`;
        const file = std.open(path, 'r');
        if (!file) {
            return { ok: false, error: 'file_not_found', detail: `${fileName} not found in session ${sessionId}` };
        }
        try {
            const content = file.readAsString();
            return { ok: true, content };
        } catch (e) {
            return { ok: false, error: 'read_error', detail: String(e) };
        } finally {
            file.close();
        }
    };
}

function fileExists(path) {
    const file = std.open(path, 'r');
    if (!file) return false;
    file.close();
    return true;
}

function fileSize(path) {
    const [stat, err] = os.stat(path);
    if (err) return 0;
    return stat.size || 0;
}

export { HistoryFileReader };
