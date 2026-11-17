import { Sys as sys } from 'gpaccore';
import { PREVIEW } from '../config.js';

const PVWC_MAGIC = 'PVWC';
const PVWC_HEADER_SIZE = 24;
const PVWC_FLAG_KEYFRAME = 1;
const PVWC_FLAG_KEYFRAMES_ONLY = 2;

function isKeyframe(packet) {
    return packet.sap === 1 || packet.sap === 2 || packet.sap === 3;
}

function createRateGate(maxKeyframesPerSec = PREVIEW.MAX_KEYFRAMES_PER_SEC) {
    return { maxKeyframesPerSec, lastDecodeTimeUs: null, mediaElapsedUs: 0, windowStartWallUs: 0, keyframesOnly: false, lastSpeed: 0, lastKeyframeSentWallUs: null };
}

// Decode time (monotonic, unlike cts with B-frames) only counts forward steps, so a looping source keeps the window running.
function shouldSendPacket(gate, decodeTimeUs, nowUs, isKey) {
    if (gate.lastDecodeTimeUs === null) {
        gate.windowStartWallUs = nowUs;
    } else if (decodeTimeUs > gate.lastDecodeTimeUs) {
        gate.mediaElapsedUs += decodeTimeUs - gate.lastDecodeTimeUs;
    }
    gate.lastDecodeTimeUs = decodeTimeUs;
    const wallElapsedUs = nowUs - gate.windowStartWallUs;
    if (wallElapsedUs >= PREVIEW.RATE_WINDOW_US) {
        gate.lastSpeed = gate.mediaElapsedUs / wallElapsedUs;
        gate.keyframesOnly = gate.mediaElapsedUs > PREVIEW.MAX_REALTIME_SPEED * wallElapsedUs;
        gate.mediaElapsedUs = 0;
        gate.windowStartWallUs = nowUs;
    } else if (gate.mediaElapsedUs > PREVIEW.MAX_REALTIME_SPEED * wallElapsedUs + PREVIEW.MAX_MEDIA_AHEAD_US) {
        // Mid-window: switch as soon as media is clearly ahead, so the first window cannot flood the browser.
        gate.keyframesOnly = true;
    }
    if (!gate.keyframesOnly) return true;
    if (!isKey) return false;
    const minKeyframeGapUs = 1000000 / gate.maxKeyframesPerSec;
    if (gate.lastKeyframeSentWallUs !== null && nowUs - gate.lastKeyframeSentWallUs < minKeyframeGapUs) return false;
    gate.lastKeyframeSentWallUs = nowUs;
    return true;
}

// PVWC layout: see the PVWC comment in src/services/ws/types.ts.
function buildCompressedFrame(previewId, pidIdx, packet, ctsUs, keyframesOnly) {
    const packetBytes = new Uint8Array(packet.data);
    const buffer = new ArrayBuffer(PVWC_HEADER_SIZE + packetBytes.byteLength);
    const header = new DataView(buffer);
    for (let charIndex = 0; charIndex < 4; charIndex++) {
        header.setUint8(charIndex, PVWC_MAGIC.charCodeAt(charIndex));
    }
    header.setUint32(4, previewId, true);
    header.setUint32(8, pidIdx, true);
    const flags = (isKeyframe(packet) ? PVWC_FLAG_KEYFRAME : 0) | (keyframesOnly ? PVWC_FLAG_KEYFRAMES_ONLY : 0);
    header.setUint32(12, flags, true);
    header.setFloat64(16, ctsUs, true);
    new Uint8Array(buffer, PVWC_HEADER_SIZE).set(packetBytes);
    return buffer;
}

function createCompressedPreviewSink(previewManager, filterIdx, sinkName, entry) {
    const hideTag = PREVIEW.DEBUG_SHOW_FILTERS ? '' : ':ITAG=NODISPLAY:LT=all@quiet';
    const sink = session.new_filter(`${sinkName}${hideTag}`);
    let firstKeyframeSeen = false;
    const rateGate = createRateGate(entry.maxKeyframesPerSec);    sink.require_source_id = true;
    sink.set_cap({ id: 'StreamType', value: 'Visual', in: true });
    sink.configure_pid = function (pid) {
        try {
            if (entry.pid !== pid) {
                entry.pid = pid;
                pid.framing = true;
                pid.send_event(new FilterEvent(GF_FEVT_PLAY));
                session.post_task(() => {
                    if (entry.pid === pid) pid.discard = false;
                    return false;
                });
            }
        } catch (error) {
            print(`[Preview] compressed configure_pid error: ${error}`);
            previewManager.send({ message: 'preview_error', previewId: entry.previewId, error: String(error) });
        }
    };
    sink.remove_pid = function (pid) {
        if (entry.pid === pid) {
            entry.pid = null;
            entry.sink = null;
            print(`[Preview] compressed pid removed idx=${filterIdx}`);
            previewManager.send({ message: 'preview_error', previewId: entry.previewId, error: 'Source removed' });
        }
    };
    sink.process = function () {
        try {
            if (!entry.pid) return;
            while (true) {
                const packet = entry.pid.get_packet();
                if (!packet) return;
                if (!firstKeyframeSeen && isKeyframe(packet)) {
                    firstKeyframeSeen = true;
                    print(`[Preview] compressed first keyframe idx=${filterIdx} sap=${packet.sap} cts=${packet.cts} size=${packet.size}`);
                }
                const socket = previewManager.client.client;
                if (firstKeyframeSeen && socket) {
                    const ctsUs = Math.round(packet.cts * 1e6 / entry.pid.timescale);
                    const dtsUs = Math.round(packet.dts * 1e6 / entry.pid.timescale);
                    const wasKeyframesOnly = rateGate.keyframesOnly;                    const send = shouldSendPacket(rateGate, dtsUs, sys.clock_us(), isKeyframe(packet));
                    if (rateGate.keyframesOnly !== wasKeyframesOnly) {
                        print(`[Preview] rate gate idx=${filterIdx} keyframesOnly=${rateGate.keyframesOnly} limit=${rateGate.maxKeyframesPerSec} speed=${rateGate.lastSpeed.toFixed(2)} dtsUs=${dtsUs}`);
                    }                    if (send) {
                        socket.send(buildCompressedFrame(entry.previewId, entry.pidIdx, packet, ctsUs, rateGate.keyframesOnly));
                    }
                }
                entry.pid.drop_packet();
            }
        } catch (error) {
            print(`[Preview] compressed process error: ${error}`);
        }
    };
    return sink;
}

export { buildCompressedFrame, createCompressedPreviewSink, createRateGate, shouldSendPacket };
