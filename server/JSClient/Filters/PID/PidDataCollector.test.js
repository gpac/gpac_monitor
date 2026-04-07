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

describe('PidDataCollector collectInputPids', () => {
  let collector;

  beforeEach(() => {
    collector = new PidDataCollector();
  });

  it('includes properties when includeProperties is true', () => {
    const filter = makeFakeFilter(1, STATIC_PROPS);
    const ipids = collector.collectInputPids(filter, true);
    expect(ipids['V1'].properties).toBeDefined();
    expect(ipids['V1'].properties.Width.value).toBe(640);
  });

  it('omits properties when includeProperties is false', () => {
    const filter = makeFakeFilter(1, STATIC_PROPS);
    const ipids = collector.collectInputPids(filter, false);
    expect(ipids['V1'].properties).toBeUndefined();
  });

  it('omits properties when includeProperties is not passed', () => {
    const filter = makeFakeFilter(1, STATIC_PROPS);
    const ipids = collector.collectInputPids(filter);
    expect(ipids['V1'].properties).toBeUndefined();
  });

  it('always includes properties on repeated calls with includeProperties true', () => {
    const filter = makeFakeFilter(1, STATIC_PROPS);
    collector.collectInputPids(filter, true);
    const ipids = collector.collectInputPids(filter, true);
    expect(ipids['V1'].properties).toBeDefined();
    expect(ipids['V1'].properties.Width.value).toBe(640);
  });

  it('reflects updated values when includeProperties is true', () => {
    const filter1 = makeFakeFilter(1, STATIC_PROPS);
    collector.collectInputPids(filter1, true);

    const changed = { ...STATIC_PROPS, Width: { type: 'uint', value: 1920 } };
    const filter2 = makeFakeFilter(1, changed);
    const ipids = collector.collectInputPids(filter2, true);
    expect(ipids['V1'].properties.Width.value).toBe(1920);
  });

  it('collects basic pid fields regardless of includeProperties', () => {
    const filter = makeFakeFilter(1, STATIC_PROPS);
    const ipids = collector.collectInputPids(filter, false);
    expect(ipids['V1'].name).toBe('V1');
    expect(ipids['V1'].width).toBe(640);
    expect(ipids['V1'].codec).toBe('raw');
    expect(ipids['V1'].type).toBe('Visual');
  });

  it('enumerates all properties only when includeProperties is true', () => {
    let enumerationCount = 0;
    const filter = {
      ...makeFakeFilter(1, STATIC_PROPS),
      ipid_props(i, nameOrCb) {
        if (typeof nameOrCb === 'function') {
          enumerationCount++;
          for (const [k, v] of Object.entries(STATIC_PROPS)) {
            nameOrCb(k, v.type, v.value);
          }
          return;
        }
        return STATIC_PROPS[nameOrCb]?.value ?? null;
      },
    };

    collector.collectInputPids(filter, false);
    expect(enumerationCount).toBe(0);

    collector.collectInputPids(filter, true);
    expect(enumerationCount).toBe(1);
  });
});
