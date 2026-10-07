import { PREVIEW } from '../config.js';

function createCompressedPreviewSink(previewManager, filterIdx, sinkName, entry) {
    const hideTag = PREVIEW.DEBUG_SHOW_FILTERS ? '' : ':ITAG=NODISPLAY:LT=all@quiet';
    const sink = session.new_filter(`${sinkName}${hideTag}`);
    let firstPacketLogged = false;
    sink.require_source_id = true;
    sink.set_cap({ id: 'StreamType', value: 'Visual', in: true });
    sink.configure_pid = function (pid) {
        try {
            if (entry.pid !== pid) {
                entry.pid = pid;
                pid.send_event(new FilterEvent(GF_FEVT_PLAY));
                session.post_task(() => {
                    if (entry.pid === pid) pid.discard = false;
                    return false;
                });
            }
            print(`[Preview] compressed configured idx=${filterIdx} pid=${pid.name} codec=${pid.get_prop('CodecID')}`);
        } catch (error) {
            print(`[Preview] compressed configure_pid error: ${error}`);
            previewManager.send({ message: 'preview_error', filterIdx, error: String(error) });
        }
    };
    sink.remove_pid = function (pid) {
        if (entry.pid === pid) {
            entry.pid = null;
            print(`[Preview] compressed pid removed idx=${filterIdx}`);
        }
    };
    sink.process = function () {
        try {
            if (!entry.pid) return;
            while (true) {
                const packet = entry.pid.get_packet();
                if (!packet) return;
                if (!firstPacketLogged) {
                    firstPacketLogged = true;
                    print(`[Preview] compressed first packet idx=${filterIdx} sap=${packet.sap} size=${packet.size}`);
                }
                entry.pid.drop_packet();
            }
        } catch (error) {
            print(`[Preview] compressed process error: ${error}`);
        }
    };
    return sink;
}

export { createCompressedPreviewSink };
