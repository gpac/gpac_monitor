import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PreviewManager } from './PreviewManager.js';

function makeFakeClient() {
    return { client: { send: vi.fn() } };
}

function makeFakeOutputTarget(nb_opid, visualOutputIndex) {
    return {
        name: 'reframer',
        type: 'reframer',
        nb_ipid: 0,
        nb_opid,
        opid_props(index, propName) {
            if (propName === 'StreamType') return index === visualOutputIndex ? 'Visual' : 'Audio';
            return null;
        },
        reconnect: vi.fn(),
    };
}

function makeFakeMultiInputFilter(sources) {
    return {
        name: 'reframer',
        type: 'reframer',
        nb_ipid: sources.length,
        nb_opid: 0,
        ipid_props(index, propName) {
            if (propName === 'StreamType') return 'Visual';
            return null;
        },
        ipid_source(index) {
            return sources[index];
        },
        ipid_source_opid_idx(index) {
            return sources[index].opidIdx;
        },
    };
}

describe('PreviewManager doStartPreview reconnect targeting', () => {
    let originalSession;
    let originalPrint;

    beforeEach(() => {
        originalSession = globalThis.session;
        originalPrint = globalThis.print;
        globalThis.print = vi.fn();
    });

    afterEach(() => {
        globalThis.session = originalSession;
        globalThis.print = originalPrint;
    });

    it('reconnects only the resolved output pid, not every output of the filter', () => {
        const target = makeFakeOutputTarget(4, 2);
        const fakeSink = {
            require_source_id: false,
            set_cap: vi.fn(),
            set_source: vi.fn(),
        };
        const fakeFfsws = { name: 'ffsws' };
        globalThis.session = {
            get_filter: (idx) => (idx === '1' ? target : null),
            new_filter: () => fakeSink,
            add_filter: vi.fn(() => fakeFfsws),
        };

        const manager = new PreviewManager(makeFakeClient());
        manager.doStartPreview(1, 'reframer', 'output', 2);

        expect(globalThis.session.add_filter).toHaveBeenCalledWith(expect.stringMatching(/^ffsws:.*:RSID/), target);
        expect(fakeSink.set_source).toHaveBeenCalledWith(fakeFfsws);
        expect(target.reconnect).toHaveBeenCalledWith(undefined, 2);
    });

    it('resolves an input row to its upstream source filter and opid, not the filter itself', () => {
        const sourceA = { name: 'ffdec_A', reconnect: vi.fn(), opidIdx: 0 };
        const sourceB = { name: 'ffdec_B', reconnect: vi.fn(), opidIdx: 3 };
        const filter = makeFakeMultiInputFilter([sourceA, sourceB]);
        const fakeSink = {
            require_source_id: false,
            set_cap: vi.fn(),
            set_source: vi.fn(),
        };
        const fakeFfsws = { name: 'ffsws' };
        globalThis.session = {
            get_filter: (idx) => (idx === '1' ? filter : null),
            new_filter: () => fakeSink,
            add_filter: vi.fn(() => fakeFfsws),
        };

        const manager = new PreviewManager(makeFakeClient());
        manager.doStartPreview(1, 'reframer', 'input', 1);

        expect(globalThis.session.add_filter).toHaveBeenCalledWith(expect.stringMatching(/^ffsws:.*:RSID/), sourceB);
        expect(fakeSink.set_source).toHaveBeenCalledWith(fakeFfsws);
        expect(sourceB.reconnect).toHaveBeenCalledWith(undefined, 3);
        expect(sourceA.reconnect).not.toHaveBeenCalled();
    });

    it('keys previews by filterIdx+direction+pidIdx so a second row on the same filter starts fresh instead of resuming the first', () => {
        const target = makeFakeOutputTarget(4, 2);
        target.opid_props = (index, propName) => {
            if (propName !== 'StreamType') return null;
            return index === 2 || index === 3 ? 'Visual' : 'Audio';
        };
        const sinks = [];
        globalThis.session = {
            get_filter: (idx) => (idx === '1' ? target : null),
            new_filter: () => {
                const sink = { require_source_id: false, set_cap: vi.fn(), set_source: vi.fn() };
                sinks.push(sink);
                return sink;
            },
            add_filter: () => ({ name: 'ffsws' }),
        };

        const manager = new PreviewManager(makeFakeClient());
        manager.doStartPreview(1, 'reframer', 'output', 2);
        manager.doStartPreview(1, 'reframer', 'output', 3);

        expect(sinks).toHaveLength(2);
        expect(target.reconnect).toHaveBeenNthCalledWith(1, undefined, 2);
        expect(target.reconnect).toHaveBeenNthCalledWith(2, undefined, 3);
        expect(manager.activePreviews.size).toBe(2);
    });

    it('removes the sink on stop so reopening the same row builds a new one', () => {
        const target = makeFakeOutputTarget(4, 2);
        const sinks = [];
        globalThis.session = {
            get_filter: (idx) => (idx === '1' ? target : null),
            new_filter: () => {
                const sink = { require_source_id: false, set_cap: vi.fn(), set_source: vi.fn() };
                sinks.push(sink);
                return sink;
            },
            add_filter: () => ({ name: 'ffsws' }),
            remove_filter: vi.fn(),
        };

        const manager = new PreviewManager(makeFakeClient());
        manager.doStartPreview(1, 'reframer', 'output', 2);
        manager.doStopPreview(1, 'output', 2);
        manager.doStartPreview(1, 'reframer', 'output', 2);

        expect(globalThis.session.remove_filter).toHaveBeenCalledTimes(1);
        expect(globalThis.session.remove_filter).toHaveBeenCalledWith(sinks[0]);
        expect(sinks).toHaveLength(2);
        expect(manager.activePreviews.size).toBe(1);
    });
});
