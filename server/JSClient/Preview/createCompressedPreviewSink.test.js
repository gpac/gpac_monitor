import { describe, it, expect } from 'vitest';
import { buildCompressedFrame, createRateGate, shouldSendPacket } from './createCompressedPreviewSink.js';
import { PREVIEW } from '../config.js';

const FRAME_CTS_STEP_US = 40000;
const KEYFRAME_INTERVAL = 25;

// Feeds 25 fps packets whose wall-clock spacing is FRAME_CTS_STEP_US / speed.
function feedPackets(gate, { speed, frameCount, startCtsUs = 0, startWallUs = 0, keyframeInterval = KEYFRAME_INTERVAL }) {
    const results = [];
    for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
        const ctsUs = startCtsUs + frameIndex * FRAME_CTS_STEP_US;
        const wallUs = startWallUs + Math.round((frameIndex * FRAME_CTS_STEP_US) / speed);
        const isKey = frameIndex % keyframeInterval === 0;
        results.push({ wallUs, isKey, sent: shouldSendPacket(gate, ctsUs, wallUs, isKey) });
    }
    return results;
}

describe('shouldSendPacket', () => {
    it('sends only keyframes once media runs 10x faster than realtime', () => {
        const gate = createRateGate();
        const results = feedPackets(gate, { speed: 10, frameCount: 1000 });
        const afterFirstWindow = results.filter((packet) => packet.wallUs > 1100000);
        expect(afterFirstWindow.filter((packet) => packet.sent && !packet.isKey)).toHaveLength(0);
        expect(afterFirstWindow.some((packet) => packet.sent && packet.isKey)).toBe(true);
    });

    it('caps keyframes per wall-clock second when media runs 286x faster than realtime', () => {
        const gate = createRateGate();
        const results = feedPackets(gate, { speed: 286, frameCount: 25 * 286 * 3, keyframeInterval: 117 });
        for (let wallSecond = 1; wallSecond < 3; wallSecond++) {
            const sentKeyframes = results.filter((packet) =>
                packet.sent && packet.wallUs >= wallSecond * 1000000 && packet.wallUs < (wallSecond + 1) * 1000000);
            expect(sentKeyframes.length).toBeGreaterThan(0);
            expect(sentKeyframes.length).toBeLessThanOrEqual(PREVIEW.MAX_KEYFRAMES_PER_SEC);
        }
    });

    it('bounds packets sent during the first window when media runs 286x faster than realtime', () => {
        const gate = createRateGate();
        const results = feedPackets(gate, { speed: 286, frameCount: 25 * 286 });
        const sentInFirstWindow = results.filter((packet) => packet.sent && packet.wallUs < PREVIEW.RATE_WINDOW_US);
        const maxPacketsBeforeSwitch = Math.ceil(PREVIEW.MAX_MEDIA_AHEAD_US / FRAME_CTS_STEP_US) + 1;
        expect(sentInFirstWindow.length).toBeLessThanOrEqual(maxPacketsBeforeSwitch + PREVIEW.MAX_KEYFRAMES_PER_SEC);
    });

    it('never throttles a stream running below the realtime tolerance', () => {
        const gate = createRateGate();
        const results = feedPackets(gate, { speed: 1.4, frameCount: 105 });
        expect(results.every((packet) => packet.sent)).toBe(true);
    });

    it('sends every packet at realtime pace', () => {
        const gate = createRateGate();
        const results = feedPackets(gate, { speed: 1, frameCount: 100 });
        expect(results.every((packet) => packet.sent)).toBe(true);
    });

    it('returns to full sending after cts goes back at realtime pace', () => {
        const gate = createRateGate();
        const flood = feedPackets(gate, { speed: 10, frameCount: 500 });
        const floodEndWallUs = flood[flood.length - 1].wallUs;
        const looped = feedPackets(gate, { speed: 1, frameCount: 100, startWallUs: floodEndWallUs + 4000 });
        const lastSecond = looped.filter((packet) => packet.wallUs > floodEndWallUs + 2100000);
        expect(lastSecond.length).toBeGreaterThan(0);
        expect(lastSecond.every((packet) => packet.sent)).toBe(true);
    });
});

describe('buildCompressedFrame', () => {
    it.each([
        { sap: 0, keyframesOnly: false, flags: 0 },
        { sap: 1, keyframesOnly: false, flags: 1 },
        { sap: 0, keyframesOnly: true, flags: 2 },
        { sap: 1, keyframesOnly: true, flags: 3 },
    ])('writes flags $flags for sap=$sap keyframesOnly=$keyframesOnly', ({ sap, keyframesOnly, flags }) => {
        const packet = { sap, data: new Uint8Array([7, 8]).buffer };
        const frame = new DataView(buildCompressedFrame(1, 0, packet, 0, keyframesOnly));
        expect(frame.getUint32(12, true)).toBe(flags);
    });
});
