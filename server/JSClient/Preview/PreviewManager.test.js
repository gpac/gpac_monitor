import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PreviewManager } from './PreviewManager.js';

function makeFakeClient() {
    return { client: { send: vi.fn() } };
}

function makeFakeTarget(nb_opid, visualOutputIndex) {
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
        const target = makeFakeTarget(4, 2);
        const fakeSink = {
            require_source_id: false,
            set_cap: vi.fn(),
            set_source: vi.fn(),
        };
        globalThis.session = {
            get_filter: (idx) => (idx === '1' ? target : null),
            new_filter: () => fakeSink,
        };

        const manager = new PreviewManager(makeFakeClient());
        manager.doStartPreview(1, 'reframer');

        expect(fakeSink.set_source).toHaveBeenCalledWith(target);
        expect(target.reconnect).toHaveBeenCalledWith(undefined, 2);
    });
});
