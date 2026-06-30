import { FileIO } from 'gpaccore';
import { base64ArrayBuffer, concatUint8Arrays } from './base64.js';

// Manages on-demand PNG snapshot captures from GPAC filter outputs.
function PreviewManager(client) {
    this.client = client;
    this.activePreviews = new Map();

    // Sends a JSON message to the dashboard client.
    this.send = function (payload) {
        this.client.client.send(JSON.stringify(payload));
    };

    // Returns true if the filter has at least one visual output PID.
    this.hasVisualOutput = function (filter) {
        for (let outputIndex = 0; outputIndex < filter.nb_opid; outputIndex++) {
            if (filter.opid_props(outputIndex, "StreamType") === "Visual") return true;
        }
        return false;
    };

    // Builds the FileIO instance with named callbacks for a given filterIdx.
    this.createPreviewFileIO = function (filterIdx) {
        const chunks = [];
        const previewManager = this;

        function openPreviewFile() { return true; }
        function closePreviewFile() { previewManager.onCaptureClose(filterIdx, chunks); }
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

    // Inserts a probe on the filter to capture one PNG frame.
    this.startPreview = function (filterIdx, filterName) {
        const filter = session.get_filter(String(filterIdx));
        if (!filter || filter.name !== filterName) {
            this.send({ message: 'preview_error', filterIdx, error: 'filter not found' });
            return;
        }
        if (!this.hasVisualOutput(filter)) {
            this.send({ message: 'preview_error', filterIdx, error: 'not a video PID' });
            return;
        }
        this.removePreview(filterIdx);

        const fileIO = this.createPreviewFileIO(filterIdx);
        const probe = filter.insert(`dst=${fileIO.url}:osize=128x128:ITAG=NODISPLAY`);
        this.activePreviews.set(filterIdx, { probe, fileIO });
    };

    // Called when the FileIO closes — assembles chunks, sends Base64 frame, defers probe removal.
    this.onCaptureClose = function (filterIdx, chunks) {
        const dataBase64 = base64ArrayBuffer(concatUint8Arrays(chunks));
        this.send({ message: 'preview_frame', filterIdx, dataBase64 });
        const previewManager = this;
        session.post_task(function () { previewManager.removePreview(filterIdx); return false; });
    };

    // Removes the probe and FileIO for a given filterIdx.
    this.removePreview = function (filterIdx) {
        const entry = this.activePreviews.get(filterIdx);
        if (!entry) return;
        try { entry.probe.remove(); } catch (e) {}
        this.activePreviews.delete(filterIdx);
    };

    // Stops the preview and notifies the dashboard.
    this.stopPreview = function (filterIdx) {
        this.removePreview(filterIdx);
        this.send({ message: 'preview_stopped', filterIdx });
    };

    // Removes all active previews on client disconnect.
    this.cleanup = function () {
        const indexes = Array.from(this.activePreviews.keys());
        for (const filterIdx of indexes) this.removePreview(filterIdx);
    };
}

export { PreviewManager };
