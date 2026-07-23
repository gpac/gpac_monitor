import { describe, it, expect } from 'vitest';
import { parseMetricDefinitions } from '../metricDefinitionParser';

const REAL_SESSION_METRICS = `freg=*;prog=Progress
freg=*;done=Done;u=bool
freg=*;pc=Percent;u=pc
freg=*;info=Information;t=str
freg=*;type=Stream Type;t=str;v=[V:Video,A:Audio,T:Text,M:Metadata]
freg=*;time=Time;u=s
freg=*;r_rate=Reception rate;u=kbps
freg=*;r_bytes=Bytes received
freg=*;r_pck=Packets received
freg=*;s_rate=Send rate;u=kbps
freg=*;s_bytes=Bytes sent
freg=*;s_pck=Packets sent
freg=*;ohead=Mux Overhead;u=pc
freg=*;ohead_pck=Per-packet Overhead;i=per-packet overhead of mux, packetization...;u=bytes
freg=*;twnd=Statistic window time;u=ms
freg=*;wait=Waiting;i=Filter is in a waiting state;u=bool
freg=*;buffer=Buffer occupancy;i=buffer occupancy as (current buffer) / (target max buffer);u=ms;t=frac
freg=*;fps=Frames per second;u=fps
freg=ffenc;Q=Quality;m=1;M=32767;i=Frame quality (low is good)
freg=ffenc;PT=Picture type;t=str;v=[I:Intra, P:Predicted, B:Bi-directional, S:Sprite, SI:Switching Intra, SP:Switching Predicited, BI:Bidirectionnal with intra MBs only, U:Unknown]
freg=ffenc;LAT=Latency;i=Internal latency;u=f
freg=dasher;seg=Segment Number
freg=dasher;period=Period ID;i=ID of DASH period;t=str
freg=rfnalu;NALU=NAL Units
freg=rfnalu;I=I slices
freg=rfnalu;P=P slices
freg=rfnalu;B=B slices
freg=rfnalu;SI=SI slices
freg=rfnalu;SP=SP slices
freg=rfnalu;IDR=IDR slices
freg=rfnalu;CRA=CRA slices
freg=rfnalu;SEI=SEI Messages
freg=mp4mx;segs=Segments;i=Number of segments produced
freg=mp4mx;frags=Fragments;i=Number of fragments produced
freg=mp4mx;next=Next start;i=time of next fragment/segment start;u=s
freg=mp4mx;spf=Sample per fragment;i=number of sample for track in current fragment
`;

describe('parseMetricDefinitions', () => {
  describe('type inference', () => {
    it('defaults to num when t is absent', () => {
      const map = parseMetricDefinitions('freg=rfnalu;NALU=NAL Units');
      expect(map['NALU']?.type).toBe('num');
    });

    it('parses t=str correctly', () => {
      const map = parseMetricDefinitions(
        'freg=dasher;period=Period ID;i=ID of DASH period;t=str',
      );
      expect(map['period']?.type).toBe('str');
    });

    it('parses t=num explicitly', () => {
      const map = parseMetricDefinitions('freg=foo;rate=Rate;t=num');
      expect(map['rate']?.type).toBe('num');
    });

    it('parses t=frac', () => {
      const map = parseMetricDefinitions('freg=foo;buf=Buffer;t=frac;u=ms');
      expect(map['buf']?.type).toBe('frac');
    });

    it('t=bool is not a valid type (GPAC doc: num/frac/str) → num', () => {
      const map = parseMetricDefinitions('freg=foo;done=Done;t=bool');
      expect(map['done']?.type).toBe('num');
    });

    it('falls back to num for unknown t value', () => {
      const map = parseMetricDefinitions('freg=foo;x=X;t=unknown');
      expect(map['x']?.type).toBe('num');
    });

    it('keeps u=bool as unit, type stays num (per GPAC doc)', () => {
      const map = parseMetricDefinitions('freg=*;done=Done;u=bool');
      expect(map['done']?.type).toBe('num');
      expect(map['done']?.unit).toBe('bool');
    });
  });

  describe('fields extraction', () => {
    it('extracts label from key=Label pair', () => {
      const map = parseMetricDefinitions('freg=dasher;seg=Segment Number');
      expect(map['seg']?.label).toBe('Segment Number');
    });

    it('extracts freg registry name', () => {
      const map = parseMetricDefinitions(
        'freg=mp4mx;segs=Segments;i=Number of segments produced',
      );
      expect(map['segs']?.freg).toBe('mp4mx');
    });

    it('extracts unit u=', () => {
      const map = parseMetricDefinitions('freg=mp4mx;next=Next start;u=s');
      expect(map['next']?.unit).toBe('s');
    });

    it('extracts info i=', () => {
      const map = parseMetricDefinitions(
        'freg=dasher;period=Period ID;i=ID of DASH period;t=str',
      );
      expect(map['period']?.info).toBe('ID of DASH period');
    });

    it('handles info with spaces in value', () => {
      const map = parseMetricDefinitions(
        'freg=mp4mx;next=Next start;i=time of next fragment/segment start;u=s',
      );
      expect(map['next']?.info).toBe('time of next fragment/segment start');
    });

    it('leaves unit undefined when absent', () => {
      const map = parseMetricDefinitions('freg=rfnalu;IDR=IDR slices');
      expect(map['IDR']?.unit).toBeUndefined();
    });

    it('leaves info undefined when absent', () => {
      const map = parseMetricDefinitions('freg=rfnalu;IDR=IDR slices');
      expect(map['IDR']?.info).toBeUndefined();
    });
  });

  describe('real GPAC snapshot — session_metrics payload', () => {
    it('parses all 36 entries', () => {
      const map = parseMetricDefinitions(REAL_SESSION_METRICS);
      expect(Object.keys(map)).toHaveLength(36);
    });

    it('global metrics carry freg=*', () => {
      const map = parseMetricDefinitions(REAL_SESSION_METRICS);
      for (const key of ['prog', 'done', 'buffer', 'fps', 'time']) {
        expect(map[key]?.freg).toBe('*');
      }
    });

    it('period → str (key bug fix confirmed)', () => {
      const map = parseMetricDefinitions(REAL_SESSION_METRICS);
      expect(map['period']?.type).toBe('str');
      expect(map['period']?.freg).toBe('dasher');
      expect(map['period']?.info).toBe('ID of DASH period');
    });

    it('NALU, I, P, B, IDR → num (default)', () => {
      const map = parseMetricDefinitions(REAL_SESSION_METRICS);
      for (const key of ['NALU', 'I', 'P', 'B', 'IDR']) {
        expect(map[key]?.type).toBe('num');
      }
    });

    it('next → num with unit s', () => {
      const map = parseMetricDefinitions(REAL_SESSION_METRICS);
      expect(map['next']?.type).toBe('num');
      expect(map['next']?.unit).toBe('s');
    });

    it('buffer → frac with unit ms and info containing slashes', () => {
      const map = parseMetricDefinitions(REAL_SESSION_METRICS);
      expect(map['buffer']?.type).toBe('frac');
      expect(map['buffer']?.unit).toBe('ms');
      expect(map['buffer']?.info).toBe(
        'buffer occupancy as (current buffer) / (target max buffer)',
      );
    });

    it('wait and done → unit bool, type stays num', () => {
      const map = parseMetricDefinitions(REAL_SESSION_METRICS);
      expect(map['wait']?.type).toBe('num');
      expect(map['wait']?.unit).toBe('bool');
      expect(map['done']?.unit).toBe('bool');
    });

    it('ohead_pck → info with commas preserved', () => {
      const map = parseMetricDefinitions(REAL_SESSION_METRICS);
      expect(map['ohead_pck']?.info).toBe(
        'per-packet overhead of mux, packetization...',
      );
      expect(map['ohead_pck']?.unit).toBe('bytes');
    });

    it('type → enum with 4 values (no space after commas)', () => {
      const map = parseMetricDefinitions(REAL_SESSION_METRICS);
      expect(map['type']?.values).toEqual([
        { code: 'V', desc: 'Video' },
        { code: 'A', desc: 'Audio' },
        { code: 'T', desc: 'Text' },
        { code: 'M', desc: 'Metadata' },
      ]);
    });

    it('PT → str enum with 8 picture types', () => {
      const map = parseMetricDefinitions(REAL_SESSION_METRICS);
      expect(map['PT']?.type).toBe('str');
      expect(map['PT']?.values).toHaveLength(8);
      expect(map['PT']?.values?.[0]).toEqual({ code: 'I', desc: 'Intra' });
      expect(map['PT']?.values?.[7]).toEqual({ code: 'U', desc: 'Unknown' });
    });

    it('Q → min 1, max 32767', () => {
      const map = parseMetricDefinitions(REAL_SESSION_METRICS);
      expect(map['Q']?.min).toBe(1);
      expect(map['Q']?.max).toBe(32767);
    });
  });

  describe('min/max fields', () => {
    it('parses m= as min', () => {
      const map = parseMetricDefinitions('freg=foo;level=Level;t=num;m=0');
      expect(map['level']?.min).toBe(0);
    });

    it('parses M= as max', () => {
      const map = parseMetricDefinitions('freg=foo;level=Level;t=num;M=100');
      expect(map['level']?.max).toBe(100);
    });

    it('parses both m= and M=', () => {
      const map = parseMetricDefinitions(
        'freg=foo;pc=Percent;t=num;m=0;M=100;u=pc',
      );
      expect(map['pc']?.min).toBe(0);
      expect(map['pc']?.max).toBe(100);
      expect(map['pc']?.unit).toBe('pc');
    });

    it('leaves min/max undefined when absent', () => {
      const map = parseMetricDefinitions('freg=foo;x=X');
      expect(map['x']?.min).toBeUndefined();
      expect(map['x']?.max).toBeUndefined();
    });
  });

  describe('enum values v= field', () => {
    it('parses v=[A:desc, B:desc]', () => {
      const map = parseMetricDefinitions(
        'freg=foo;type=Stream Type;t=str;v=[V:Video, A:Audio, T:Text, M:Metadata]',
      );
      expect(map['type']?.values).toEqual([
        { code: 'V', desc: 'Video' },
        { code: 'A', desc: 'Audio' },
        { code: 'T', desc: 'Text' },
        { code: 'M', desc: 'Metadata' },
      ]);
    });

    it('leaves values undefined when absent', () => {
      const map = parseMetricDefinitions('freg=foo;x=X');
      expect(map['x']?.values).toBeUndefined();
    });

    it('parses v= with descriptions containing spaces', () => {
      const map = parseMetricDefinitions(
        'freg=foo;state=State;t=str;v=[OK:All good, ERR:Error occurred]',
      );
      expect(map['state']?.values?.[0]).toEqual({
        code: 'OK',
        desc: 'All good',
      });
      expect(map['state']?.values?.[1]).toEqual({
        code: 'ERR',
        desc: 'Error occurred',
      });
    });

    it('parses code-only entry (no colon) as empty desc', () => {
      const map = parseMetricDefinitions('freg=foo;mode=Mode;t=str;v=[A, B]');
      expect(map['mode']?.values).toEqual([
        { code: 'A', desc: '' },
        { code: 'B', desc: '' },
      ]);
    });
  });

  describe('GPAC doc compliance — gf_fs_get_defined_metrics', () => {
    it('freg=* declares a global metric', () => {
      const map = parseMetricDefinitions('freg=*;uptime=Uptime;u=s');
      expect(map['uptime']?.freg).toBe('*');
      expect(map['uptime']?.label).toBe('Uptime');
    });

    it('i= with double quotes → quotes stripped', () => {
      const map = parseMetricDefinitions(
        'freg=foo;rate=Rate;i="average bitrate"',
      );
      expect(map['rate']?.info).toBe('average bitrate');
    });

    it('i= with double quotes preserves semicolons inside quotes', () => {
      const map = parseMetricDefinitions(
        'freg=foo;rate=Rate;i="bitrate; average over 1s";u=kbps',
      );
      expect(map['rate']?.info).toBe('bitrate; average over 1s');
      expect(map['rate']?.unit).toBe('kbps');
    });

    it('accepts every documented unit value', () => {
      const documentedUnits = [
        'kbps',
        'fps',
        'ms',
        's',
        'bytes',
        'f',
        'p',
        'bool',
        'pc',
      ];
      for (const unit of documentedUnits) {
        const map = parseMetricDefinitions(`freg=foo;x=X;u=${unit}`);
        expect(map['x']?.unit).toBe(unit);
      }
    });

    it('accepts any string as unit (doc: "but any string is accepted")', () => {
      const map = parseMetricDefinitions('freg=mycustom;wdg=Widgets;u=widgets');
      expect(map['wdg']?.unit).toBe('widgets');
    });

    it('parses a new developer filter definition using all optional keys', () => {
      const map = parseMetricDefinitions(
        'freg=mycustom;fill=Fill level;t=frac;i="queue occupancy; sliding window";u=pc;m=0;M=100;v=[L:Low, H:High]',
      );
      const def = map['fill'];
      expect(def).toBeDefined();
      expect(def?.freg).toBe('mycustom');
      expect(def?.label).toBe('Fill level');
      expect(def?.type).toBe('frac');
      expect(def?.info).toBe('queue occupancy; sliding window');
      expect(def?.unit).toBe('pc');
      expect(def?.min).toBe(0);
      expect(def?.max).toBe(100);
      expect(def?.values).toEqual([
        { code: 'L', desc: 'Low' },
        { code: 'H', desc: 'High' },
      ]);
    });
  });

  describe('edge cases', () => {
    it('returns empty map for empty string', () => {
      expect(parseMetricDefinitions('')).toEqual({});
    });

    it('ignores blank lines', () => {
      const map = parseMetricDefinitions('\nfreg=foo;x=X\n\n');
      expect(Object.keys(map)).toHaveLength(1);
    });

    it('ignores lines without freg= prefix', () => {
      const map = parseMetricDefinitions('invalid line\nfreg=foo;x=X');
      expect(Object.keys(map)).toHaveLength(1);
    });

    it('ignores lines with no key=label pair', () => {
      const map = parseMetricDefinitions('freg=foo');
      expect(map).toEqual({});
    });
  });
});
