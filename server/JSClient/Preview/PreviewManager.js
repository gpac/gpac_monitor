import { FileIO } from 'gpaccore';
import { base64ArrayBuffer, concatUint8Arrays } from './base64.js';

// Manages on-demand PNG snapshot captures from GPAC filter outputs.
function PreviewManager(client) {
    this.client = client;
    this.activePreviews = new Map();

    // Sends a JSON message to the dashboard client.
    this.send = function (payload) {
        if (!this.client.client) return;
        this.client.client.send(JSON.stringify(payload));
    };

    // Returns the filter carrying the visual PID to probe: the filter itself if it
    // has a visual output, else the source filter of its first visual input (sinks).
    this.findPreviewTarget = function (filter) {
        for (let outputIndex = 0; outputIndex < filter.nb_opid; outputIndex++) {
            if (filter.opid_props(outputIndex, "StreamType") === "Visual") return filter;
        }
        for (let inputIndex = 0; inputIndex < filter.nb_ipid; inputIndex++) {
            if (filter.ipid_props(inputIndex, "StreamType") === "Visual") {
                return filter.ipid_source(inputIndex);
            }
        }
        return null;
    };

    // Builds the FileIO instance with named callbacks for a given filterIdx.
    this.createPreviewFileIO = function (filterIdx) {
        const chunks = [];
        let closed = false;
        const previewManager = this;

        function openPreviewFile() { return true; }
        function closePreviewFile() {
            if (closed) return;
            closed = true;
            previewManager.onCaptureClose(filterIdx, chunks);
        }
        function writePreviewChunk(buffer) { chunks.push(new Uint8Array(buffer)); return buffer.byteLength; }
        function readDisabled() { return 0; }
        function seekDisabled() { return 0; }
        function tellDisabled() { return 0; }
        function eofDisabled() { return false; }
        function existsDisabled() { return false; }

        return new FileIO(
            `preview_${filterIdx}.png`,
            openPreviewFile, closePreviewFile, writePreviewChunk,
            readDisabled, seekDisabled, tellDisabled, eofDisabled, existsDisabled
        );
    };

    this.postTask = function (taskFn) {
        session.post_task(() => {
            if (session.last_task) return false;
            taskFn();
            return false;
        });
    };

    this.startPreview = function (filterIdx, filterName) {
        this.postTask(() => this.doStartPreview(filterIdx, filterName));
    };

    // Inserts a probe on the filter to capture one PNG frame.
    this.doStartPreview = function (filterIdx, filterName) {
        const filter = session.get_filter(String(filterIdx));
        if (!filter || filter.type !== filterName) {
            this.send({ message: 'preview_error', filterIdx, error: 'filter not found' });
            return;
        }
        const target = this.findPreviewTarget(filter);
        if (!target) {
            this.send({ message: 'preview_error', filterIdx, error: 'not a video PID' });
            return;
        }
        this.removePreview(filterIdx);

        const fileIO = this.createPreviewFileIO(filterIdx);
        const probe = target.insert(`dst=${fileIO.url}:osize=128x128:pfmt=rgb:ITAG=NODISPLAY`);
        this.activePreviews.set(filterIdx, { probe, fileIO });
    };

    // Called when the FileIO closes — assembles chunks, sends Base64 frame, marks entry for removal.
    this.onCaptureClose = function (filterIdx, chunks) {
        const dataBase64 = base64ArrayBuffer(concatUint8Arrays(chunks));
        this.send({ message: 'preview_frame', filterIdx, dataBase64 });
        const entry = this.activePreviews.get(filterIdx);
        if (entry) entry.done = true;
    };

    // Called by SessionManager.tick — removes probes that have completed capture.
    this.tick = function () {
        for (const [filterIdx, entry] of this.activePreviews) {
            if (entry.done) this.removePreview(filterIdx);
        }
    };

    // Removes the probe and FileIO for a given filterIdx.
    this.removePreview = function (filterIdx) {
        const entry = this.activePreviews.get(filterIdx);
        if (!entry) return;
        try { entry.probe.remove(); } catch (e) {}
        this.activePreviews.delete(filterIdx);
    };

    this.stopPreview = function (filterIdx) {
        this.postTask(() => this.doStopPreview(filterIdx));
    };

    // Stops the preview and notifies the dashboard.
    this.doStopPreview = function (filterIdx) {
        this.removePreview(filterIdx);
        this.send({ message: 'preview_stopped', filterIdx });
    };

    this.cleanup = function () {
        this.postTask(() => this.doCleanup());
    };

    // Removes all active previews on client disconnect.
    this.doCleanup = function () {
        const indexes = Array.from(this.activePreviews.keys());
        for (const filterIdx of indexes) this.removePreview(filterIdx);
    };
}

export { PreviewManager };
