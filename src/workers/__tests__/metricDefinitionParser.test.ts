import { describe, it, expect } from 'vitest';
import { parseMetricDefinitions } from '../metricDefinitionParser';

const REAL_CUSTOM_METRICS = `freg=rfnalu;NALU=NAL Units
freg=rfnalu;I=I slices
freg=rfnalu;P=P slices
freg=rfnalu;B=B slices
freg=rfnalu;SI=SI slices
freg=rfnalu;SP=SP slices
freg=rfnalu;IDR=IDR slices
freg=rfnalu;CRA=CRA slices
freg=rfnalu;SEI=SEI Messages
freg=dasher;seg=Segment Number
freg=dasher;period=Period ID;i=ID of DASH period;t=str
freg=mp4mx;segs=Segments;i=Number of segments produced
freg=mp4mx;frags=Fragments;i=Number of fragments produced
freg=mp4mx;next=Next start;i=time of next fragment/segment start;u=s
freg=mp4mx;spf=Sample per fragment;i=number of sample for track in current fragment`;

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

  describe('real GPAC snapshot', () => {
    it('parses all 15 entries', () => {
      const map = parseMetricDefinitions(REAL_CUSTOM_METRICS);
      expect(Object.keys(map)).toHaveLength(15);
    });

    it('period → str (key bug fix confirmed)', () => {
      const map = parseMetricDefinitions(REAL_CUSTOM_METRICS);
      expect(map['period']?.type).toBe('str');
      expect(map['period']?.freg).toBe('dasher');
      expect(map['period']?.info).toBe('ID of DASH period');
    });

    it('NALU, I, P, B, IDR → num (default)', () => {
      const map = parseMetricDefinitions(REAL_CUSTOM_METRICS);
      for (const key of ['NALU', 'I', 'P', 'B', 'IDR']) {
        expect(map[key]?.type).toBe('num');
      }
    });

    it('next → num with unit s', () => {
      const map = parseMetricDefinitions(REAL_CUSTOM_METRICS);
      expect(map['next']?.type).toBe('num');
      expect(map['next']?.unit).toBe('s');
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
