import { createCompressedPreviewSink } from './createCompressedPreviewSink.js';

function PreviewManager(client) {
    this.client = client;
    this.activePreviews = new Map();

    this.send = function (payload) {
        if (!this.client.client) return;
        this.client.client.send(JSON.stringify(payload));
    };

    this.postTask = function (taskFn) {
        if (!session) {
            print(`[Preview] postTask skipped: session is null`);
            return;
        }
        try {
            session.post_task(() => {
                if (session.last_task) return false;
                taskFn();
                return false;
            });
        } catch (error) {
            print(`[Preview] postTask failed: ${error}`);
        }
    };

    this.previewKey = function (filterIdx, direction, pidIdx) {
        return `${filterIdx}:${direction}:${pidIdx}`;
    };

    this.findPreviewTarget = function (filter, direction, pidIdx) {
        if (direction === 'output') {
            if (pidIdx < 0 || pidIdx >= filter.nb_opid) return null;
            if (filter.opid_props(pidIdx, "StreamType") !== "Visual") return null;
            return { target: filter, pidIdx };
        }
        if (direction === 'input') {
            if (pidIdx < 0 || pidIdx >= filter.nb_ipid) return null;
            if (filter.ipid_props(pidIdx, "StreamType") !== "Visual") return null;
            return {
                target: filter.ipid_source(pidIdx),
                pidIdx: filter.ipid_source_opid_idx(pidIdx),
            };
        }
        return null;
    };

    this.startPreview = function (filterIdx, filterName, direction, pidIdx, previewId) {
        print(`[Preview] startPreview requested previewId=${previewId} idx=${filterIdx} name=${filterName} direction=${direction} pidIdx=${pidIdx}`);
        this.postTask(() => this.doStartPreview(filterIdx, filterName, direction, pidIdx, previewId));
    };

    this.doStartPreview = function (filterIdx, filterName, direction, pidIdx, previewId) {
        const key = this.previewKey(filterIdx, direction, pidIdx);
        if (this.activePreviews.has(key)) {
            print(`[Preview] already open key=${key}`);
            return;
        }
        const filter = session.get_filter(String(filterIdx));
        if (!filter || filter.type !== filterName) {
            print(`[Preview] filter not found idx=${filterIdx} expected=${filterName} got=${filter ? filter.type : 'null'}`);
            this.send({ message: 'preview_error', previewId, error: 'filter not found' });
            return;
        }
        const resolved = this.findPreviewTarget(filter, direction, pidIdx);
        if (!resolved || resolved.pidIdx < 0) {
            print(`[Preview] requested PID not visual idx=${filterIdx} direction=${direction} pidIdx=${pidIdx}`);
            this.send({ message: 'preview_error', previewId, error: 'not a video PID' });
            return;
        }
        const { target, pidIdx: resolvedPidIdx } = resolved;
        print(`[Preview] target resolved idx=${filterIdx} direction=${direction} requestedPidIdx=${pidIdx} resolvedPidIdx=${resolvedPidIdx} target=${target.name} type=${target.type}`);

        const entry = {
            previewId,
            sink: null,
            pid: null,
            pidIdx: resolvedPidIdx,
        };
        this.activePreviews.set(key, entry);
        try {
            const sinkName = `PreviewSink_${filterIdx}_${direction}_${pidIdx}`;
            entry.sink = createCompressedPreviewSink(this, filterIdx, sinkName, entry);
            entry.sink.set_source(target);
            target.reconnect(undefined, resolvedPidIdx);
        } catch (error) {
            print(`[Preview] doStartPreview failed idx=${filterIdx}: ${error}`);
            this.removePreview(key);
            this.send({ message: 'preview_error', previewId, error: String(error) });
        }
    };

    this.removePreview = function (key) {
        const entry = this.activePreviews.get(key);
        if (!entry) return;
        this.activePreviews.delete(key);
        entry.pid = null;
        if (entry.sink) {
            try { session.remove_filter(entry.sink); } catch (error) { print(`[Preview] sink remove error: ${error}`); }
        }
    };

    this.stopPreview = function (filterIdx, direction, pidIdx) {
        print(`[Preview] stopPreview requested idx=${filterIdx} direction=${direction} pidIdx=${pidIdx}`);
        this.postTask(() => this.doStopPreview(filterIdx, direction, pidIdx));
    };

    this.doStopPreview = function (filterIdx, direction, pidIdx) {
        const key = this.previewKey(filterIdx, direction, pidIdx);
        const entry = this.activePreviews.get(key);
        this.removePreview(key);
        if (entry) this.send({ message: 'preview_stopped', previewId: entry.previewId });
    };

    this.cleanup = function () {
        this.postTask(() => this.doCleanup());
    };

    this.doCleanup = function () {
        const keys = Array.from(this.activePreviews.keys());
        for (const key of keys) this.removePreview(key);
    };
}

export { PreviewManager };
