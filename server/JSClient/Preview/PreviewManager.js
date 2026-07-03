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
        session.post_task(() => {
            if (session.last_task) return false;
            taskFn();
            return false;
        });
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
            ffsws: null,
            sink: null,
            pid: null,
            width: 0,
            height: 0,
            lastEmitUs: 0,
            cachedPacket: null,
        };
        this.activePreviews.set(filterIdx, entry);
        try {
            entry.ffsws = session.add_filter(
                `ffsws:osize=${PREVIEW.OSIZE}:ofmt=${PREVIEW.OFMT}:ITAG=NODISPLAY`,
                target
            );
            entry.sink = this.createPreviewSink(filterIdx, entry);
            entry.sink.set_source(entry.ffsws);
        } catch (error) {


            this.removePreview(filterIdx);
            this.send({ message: 'preview_error', filterIdx, error: String(error) });
        }
    };

    this.createPreviewSink = function (filterIdx, entry) {
        const previewManager = this;
        const sink = session.new_filter(`PreviewSink_${filterIdx}`);
        sink.set_cap({ id: 'StreamType', value: 'Video', in: true });
        sink.set_cap({ id: 'CodecID', value: 'raw', in: true });
        sink.configure_pid = function (pid) {
            if (entry.pid !== pid) {
                entry.pid = pid;
                pid.send_event(new FilterEvent(GF_FEVT_PLAY));
            }
            entry.width = pid.get_prop('Width');
            entry.height = pid.get_prop('Height');
        };
        sink.process = function () {
            previewManager.drainPreviewPackets(filterIdx, entry);
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
            let data;
            if (packet.frame_ifce) {
                entry.cachedPacket = packet.clone(entry.cachedPacket);
                data = entry.cachedPacket.data;
            } else {
                data = packet.data;
            }
            this.send({
                message: 'preview_frame',
                filterIdx,
                width: entry.width,
                height: entry.height,
                dataBase64: base64ArrayBuffer(data),
            });
        } catch (error) {
            this.send({ message: 'preview_error', filterIdx, error: String(error) });
        }
    };

    this.removePreview = function (filterIdx) {
        const entry = this.activePreviews.get(filterIdx);
        if (!entry) return;
        this.activePreviews.delete(filterIdx);
        entry.pid = null;
        if (entry.sink) {
            try { session.remove_filter(entry.sink); } catch (error) {}
        }
        if (entry.ffsws) {
            try { entry.ffsws.remove(); } catch (error) {}
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
