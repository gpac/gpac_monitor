import { describe, it, expect, beforeEach } from 'vitest';
import { PidDataCollector } from './PidDataCollector.js';

/** Creates a fake GPAC filter object */
function makeFakeFilter(idx, ipidProps) {
  return {
    idx,
    nb_ipid: 1,
    ipid_props(i, nameOrCb) {
      if (typeof nameOrCb === 'function') {
        for (const [k, v] of Object.entries(ipidProps)) {
          nameOrCb(k, v.type, v.value);
        }
        return;
      }
      return ipidProps[nameOrCb]?.value ?? null;
    },
    ipid_source() { return { idx: 0 }; },
    ipid_stats() { return null; },
  };
}

const STATIC_PROPS = {
  name: { type: 'str', value: 'V1' },
  Width: { type: 'uint', value: 640 },
  Height: { type: 'uint', value: 480 },
  CodecID: { type: 'uint', value: 'raw' },
  StreamType: { type: 'uint', value: 'Visual' },
};

describe('PidDataCollector properties diff', () => {
  let collector;

  beforeEach(() => {
    collector = new PidDataCollector();
  });

  it('includes properties on first collect', () => {
    const filter = makeFakeFilter(1, STATIC_PROPS);
    const ipids = collector.collectInputPids(filter);
    expect(ipids['V1'].properties).toBeDefined();
    expect(ipids['V1'].properties.Width.value).toBe(640);
  });

  it('omits properties on second collect when unchanged', () => {
    const filter = makeFakeFilter(1, STATIC_PROPS);
    collector.collectInputPids(filter); // first
    const ipids = collector.collectInputPids(filter); // second
    expect(ipids['V1'].properties).toBeUndefined();
  });

  it('re-includes properties when a value changes', () => {
    const filter1 = makeFakeFilter(1, STATIC_PROPS);
    collector.collectInputPids(filter1);

    const changed = { ...STATIC_PROPS, Width: { type: 'uint', value: 1920 } };
    const filter2 = makeFakeFilter(1, changed);
    const ipids = collector.collectInputPids(filter2);
    expect(ipids['V1'].properties).toBeDefined();
    expect(ipids['V1'].properties.Width.value).toBe(1920);
  });

  it('omits again after change is sent', () => {
    const filter1 = makeFakeFilter(1, STATIC_PROPS);
    collector.collectInputPids(filter1);

    const changed = { ...STATIC_PROPS, Width: { type: 'uint', value: 1920 } };
    const filter2 = makeFakeFilter(1, changed);
    collector.collectInputPids(filter2); // sends change

    const ipids = collector.collectInputPids(filter2); // third
    expect(ipids['V1'].properties).toBeUndefined();
  });
});
