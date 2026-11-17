const port = 6392;
const connectDeadlineMs = 20000;
const handshakeTimeoutMs = 2000;
const replyTimeoutMs = 10000;
const previewId = 1;
const keyframeFlag = 1;

function fail(reason) {
    console.error(reason);
    process.exit(1);
}

// A fresh GPAC accepts connections before server.js is loaded; such a client never gets monitor_config.
function connectReady() {
    const deadline = Date.now() + connectDeadlineMs;
    return new Promise((resolve) => {
        const retry = (socket) => {
            socket.onerror = null;
            socket.onmessage = null;
            socket.close();
            if (Date.now() > deadline) fail(`no monitor_config on port ${port} within ${connectDeadlineMs} ms`);
            setTimeout(attempt, 500);
        };
        const attempt = () => {
            const socket = new WebSocket(`ws://127.0.0.1:${port}`);
            socket.binaryType = 'arraybuffer';
            const timer = setTimeout(() => retry(socket), handshakeTimeoutMs);
            socket.onerror = () => {
                clearTimeout(timer);
                retry(socket);
            };
            socket.onmessage = (event) => {
                if (typeof event.data !== 'string') return;
                if (JSON.parse(event.data).message !== 'monitor_config') return;
                clearTimeout(timer);
                resolve(socket);
            };
        };
        attempt();
    });
}

function failOnPreviewError(message) {
    if (message.message === 'preview_error') fail(`preview_error: ${message.error}`);
}

function waitForJson(socket, expected) {
    return new Promise((resolve) => {
        const timer = setTimeout(() => fail(`no ${expected} within ${replyTimeoutMs} ms`), replyTimeoutMs);
        socket.onmessage = (event) => {
            if (typeof event.data !== 'string') return;
            const message = JSON.parse(event.data);
            failOnPreviewError(message);
            if (message.message !== expected) return;
            clearTimeout(timer);
            resolve(message);
        };
    });
}

function waitForFrame(socket) {
    return new Promise((resolve) => {
        const timer = setTimeout(() => fail(`no PVWC frame within ${replyTimeoutMs} ms`), replyTimeoutMs);
        socket.onmessage = (event) => {
            if (typeof event.data === 'string') {
                failOnPreviewError(JSON.parse(event.data));
                return;
            }
            clearTimeout(timer);
            resolve(new DataView(event.data));
        };
    });
}

const socket = await connectReady();
const send = (message, fields = {}) => socket.send(`json:${JSON.stringify({ message, ...fields })}`);

send('get_all_filters');
const filtersReply = await waitForJson(socket, 'filters');
const reframerFilter = filtersReply.filters.find((filter) => filter.type === 'reframer');
if (!reframerFilter) fail('no reframer filter in graph');

const target = { idx: reframerFilter.idx, direction: 'input', pidIdx: 0 };
send('start_pid_preview', { ...target, name: reframerFilter.type, previewId, maxKeyframesPerSec: 10 });
const frame = await waitForFrame(socket);

const magic = String.fromCharCode(...new Uint8Array(frame.buffer, 0, 4));
if (magic !== 'PVWC') fail(`frame magic ${magic}, expected PVWC`);
const framePreviewId = frame.getUint32(4, true);
if (framePreviewId !== previewId) fail(`frame previewId ${framePreviewId}, expected ${previewId}`);
const flags = frame.getUint32(12, true);
if ((flags & keyframeFlag) === 0) fail(`first frame is not a keyframe (flags ${flags})`);
console.log(`PVWC frame previewId ${framePreviewId} flags ${flags} size ${frame.byteLength}`);

send('stop_pid_preview', target);
const stoppedReply = await waitForJson(socket, 'preview_stopped');
if (stoppedReply.previewId !== previewId) fail(`preview_stopped previewId ${stoppedReply.previewId}, expected ${previewId}`);
console.log(`preview_stopped previewId ${stoppedReply.previewId}`);

socket.close();
process.exit(0);
