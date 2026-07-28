import { Sys as sys } from 'gpaccore';
import { base64ArrayBuffer } from './base64.js';
import { PREVIEW } from '../config.js';

function PreviewManager(client) {
    this.client = client;
    this.activePreviews = new Map();

    this.send = function (payload) {
        if (!this.client.client) return;
        this.client.client.send(JSON.stringify(payload));
    };

    this.postTask = function (taskFn) {
        if (!session) return;
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

    this.startPreview = function (filterIdx, filterName) {
        this.postTask(() => this.doStartPreview(filterIdx, filterName));
    };

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

        const entry = {
            sink: null,
            pid: null,
            width: 0,
            height: 0,
            target: { Width: PREVIEW.WIDTH, Height: PREVIEW.HEIGHT, PixelFormat: PREVIEW.PIXEL_FORMAT },
            lastEmitUs: 0,
        };
        this.activePreviews.set(filterIdx, entry);
        try {
            entry.sink = this.createPreviewSink(filterIdx, entry);
            entry.sink.set_source(target);

            target.reconnect();
        } catch (error) {
            this.removePreview(filterIdx);
            this.send({ message: 'preview_error', filterIdx, error: String(error) });
        }
    };

    this.negotiateFormat = function (pid, target) {
        for (const propName in target) {
            if (pid.get_prop(propName) !== target[propName]) {
                pid.negotiate_prop(propName, target[propName]);
            }
        }
    };

    this.createPreviewSink = function (filterIdx, entry) {
        const previewManager = this;
        const hideTag = PREVIEW.DEBUG_SHOW_FILTERS ? '' : ':ITAG=NODISPLAY';
        const sink = session.new_filter(`PreviewSink_${filterIdx}${hideTag}`);
        sink.require_source_id = true;
        print(`[Preview] sink ${filterIdx} created, itag=${sink.itag}`);
        sink.set_cap({ id: 'StreamType', value: 'Visual', in: true });
        sink.set_cap({ id: 'CodecID', value: 'raw', in: true });
        sink.configure_pid = function (pid) {
            try {
                previewManager.negotiateFormat(pid, entry.target);
                if (entry.pid !== pid) {
                    entry.pid = pid;
                    pid.send_event(new FilterEvent(GF_FEVT_PLAY));
                }
                entry.width = pid.get_prop('Width');
                entry.height = pid.get_prop('Height');
            } catch (error) {
                print(`[Preview] configure_pid error: ${error}`);
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
            if (nowUs - entry.lastEmitUs >= PREVIEW.INTERVAL_US) {
                entry.lastEmitUs = nowUs;
                this.sendFrame(filterIdx, entry, packet);
            }
            entry.pid.drop_packet();
        }
    };

    this.sendFrame = function (filterIdx, entry, packet) {
        try {
            if (packet.frame_ifce) {
                this.send({ message: 'preview_error', filterIdx, error: 'GPU frame preview not supported yet' });
                return;
            }
            const data = packet.data;
            this.send({
                message: 'preview_frame',
                filterIdx,
                width: entry.width,
                height: entry.height,
                dataBase64: base64ArrayBuffer(data),
            });
        } catch (error) {
            print(`[Preview] sendFrame error: ${error}`);
            this.send({ message: 'preview_error', filterIdx, error: String(error) });
        }
    };

    this.removePreview = function (filterIdx) {
        const entry = this.activePreviews.get(filterIdx);
        if (!entry) return;
        this.activePreviews.delete(filterIdx);
        entry.pid = null;
        if (entry.sink) {
            try { session.remove_filter(entry.sink); } catch (error) { print(`[Preview] sink remove error: ${error}`); }
        }
    };

    this.stopPreview = function (filterIdx) {
        this.postTask(() => this.doStopPreview(filterIdx));
    };

    this.doStopPreview = function (filterIdx) {
        this.removePreview(filterIdx);
        this.send({ message: 'preview_stopped', filterIdx });
    };

    this.cleanup = function () {
        this.postTask(() => this.doCleanup());
    };

    this.doCleanup = function () {
        const indexes = Array.from(this.activePreviews.keys());
        for (const filterIdx of indexes) this.removePreview(filterIdx);
    };
}

export { PreviewManager };
