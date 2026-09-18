import { Sys as sys } from 'gpaccore';
import { PREVIEW } from '../config.js';
import { quiet_hidden_chain } from '../filterUtils.js';

const PVWF_MAGIC = 'PVWF';
const PVWF_HEADER_SIZE = 20;

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

    this.startPreview = function (filterIdx, filterName, direction, pidIdx) {
        print(`[Preview] startPreview requested idx=${filterIdx} name=${filterName} direction=${direction} pidIdx=${pidIdx}`);
        this.postTask(() => this.doStartPreview(filterIdx, filterName, direction, pidIdx));
    };

    this.doStartPreview = function (filterIdx, filterName, direction, pidIdx) {
        const key = this.previewKey(filterIdx, direction, pidIdx);
        const existingEntry = this.activePreviews.get(key);
        if (existingEntry) {
            this.resumePreview(key, existingEntry);
            return;
        }
        const filter = session.get_filter(String(filterIdx));
        if (!filter || filter.type !== filterName) {
            print(`[Preview] filter not found idx=${filterIdx} expected=${filterName} got=${filter ? filter.type : 'null'}`);
            this.send({ message: 'preview_error', filterIdx, error: 'filter not found' });
            return;
        }
        const resolved = this.findPreviewTarget(filter, direction, pidIdx);
        if (!resolved || resolved.pidIdx < 0) {
            print(`[Preview] requested PID not visual idx=${filterIdx} direction=${direction} pidIdx=${pidIdx}`);
            this.send({ message: 'preview_error', filterIdx, error: 'not a video PID' });
            return;
        }
        const { target, pidIdx: resolvedPidIdx } = resolved;
        print(`[Preview] target resolved idx=${filterIdx} direction=${direction} requestedPidIdx=${pidIdx} resolvedPidIdx=${resolvedPidIdx} target=${target.name} type=${target.type}`);

        const entry = {
            sink: null,
            pid: null,
            pidIdx: resolvedPidIdx,
            active: true,
            width: 0,
            height: 0,
            target: { Width: PREVIEW.WIDTH, Height: PREVIEW.HEIGHT, PixelFormat: PREVIEW.PIXEL_FORMAT },
            lastEmitUs: 0,
        };
        this.activePreviews.set(key, entry);
        try {
            entry.sink = this.createPreviewSink(filterIdx, direction, pidIdx, entry);
            entry.sink.set_source(target);
            target.reconnect(undefined, resolvedPidIdx);
        } catch (error) {
            print(`[Preview] doStartPreview failed idx=${filterIdx}: ${error}`);
            this.removePreview(key);
            this.send({ message: 'preview_error', filterIdx, error: String(error) });
        }
    };

    this.resumePreview = function (key, entry) {
        entry.active = true;
        entry.lastEmitUs = 0;
        if (entry.pid) entry.pid.send_event(new FilterEvent(GF_FEVT_PLAY));
        print(`[Preview] resumed key=${key} pid=${entry.pid ? entry.pid.name : 'pending'}`);
    };

    this.pausePreview = function (key, entry) {
        entry.active = false;
        if (entry.pid) entry.pid.send_event(new FilterEvent(GF_FEVT_STOP));
        print(`[Preview] paused key=${key} pid=${entry.pid ? entry.pid.name : 'pending'}`);
    };

    this.negotiateFormat = function (pid, target) {
        for (const propName in target) {
            if (pid.get_prop(propName) !== target[propName]) {
                pid.negotiate_prop(propName, target[propName]);
            }
        }
    };

    this.createPreviewSink = function (filterIdx, direction, pidIdx, entry) {
        const previewManager = this;
        const hideTag = PREVIEW.DEBUG_SHOW_FILTERS ? '' : ':ITAG=NODISPLAY:LT=all@quiet';
        const sink = session.new_filter(`PreviewSink_${filterIdx}_${direction}_${pidIdx}${hideTag}`);
        sink.require_source_id = true;
        sink.set_cap({ id: 'StreamType', value: 'Visual', in: true });
        sink.set_cap({ id: 'CodecID', value: 'raw', in: true });
        sink.configure_pid = function (pid) {
            try {
                quiet_hidden_chain(sink.ipid_source(0));
                previewManager.negotiateFormat(pid, entry.target);
                if (entry.pid !== pid) {
                    entry.pid = pid;
                    if (entry.active) pid.send_event(new FilterEvent(GF_FEVT_PLAY));
                }
                entry.width = pid.get_prop('Width');
                entry.height = pid.get_prop('Height');
                print(`[Preview] configured idx=${filterIdx} pid=${pid.name} ${entry.width}x${entry.height} fmt=${pid.get_prop('PixelFormat')}`);
            } catch (error) {
                print(`[Preview] configure_pid error: ${error}`);
                previewManager.send({ message: 'preview_error', filterIdx, error: String(error) });
            }
        };
        sink.remove_pid = function (pid) {
            if (entry.pid === pid) {
                entry.pid = null;
                print(`[Preview] pid removed idx=${filterIdx}`);
            }
        };
        sink.process = function () {
            try {
                previewManager.drainPreviewPackets(filterIdx, entry);
            } catch (error) {
                print(`[Preview] process error: ${error}`);
            }
        };
        return sink;
    };

    this.drainPreviewPackets = function (filterIdx, entry) {
        if (!entry.pid) return;
        while (true) {
            const packet = entry.pid.get_packet();
            if (!packet) return;
            const nowUs = sys.clock_us();
            if (entry.active && nowUs - entry.lastEmitUs >= PREVIEW.INTERVAL_US) {
                entry.lastEmitUs = nowUs;
                this.sendFrame(filterIdx, entry, packet);
            }
            entry.pid.drop_packet();
        }
    };

    this.sendFrame = function (filterIdx, entry, packet) {
        try {
            if (!this.client.client) return;
            if (packet.frame_ifce) {
                this.send({ message: 'preview_error', filterIdx, error: 'GPU frame preview not supported yet' });
                return;
            }
            const pixels = new Uint8Array(packet.data);
            const buffer = new ArrayBuffer(PVWF_HEADER_SIZE + pixels.byteLength);
            const header = new DataView(buffer);
            for (let charIndex = 0; charIndex < 4; charIndex++) {
                header.setUint8(charIndex, PVWF_MAGIC.charCodeAt(charIndex));
            }
            header.setUint32(4, filterIdx, true);
            header.setUint32(8, entry.width, true);
            header.setUint32(12, entry.height, true);
            header.setUint32(16, entry.pidIdx, true);
            new Uint8Array(buffer, PVWF_HEADER_SIZE).set(pixels);
            this.client.client.send(buffer);
        } catch (error) {
            print(`[Preview] sendFrame error: ${error}`);
            this.send({ message: 'preview_error', filterIdx, error: String(error) });
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
        if (entry) this.pausePreview(key, entry);
        this.send({ message: 'preview_stopped', filterIdx });
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
