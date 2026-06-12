import { describe, it, expect } from 'vitest';
import { GpacStreamType } from '../../../types/domain/gpac';
import type { GraphFilterData } from '@/types/domain/gpac';
import {
  getFilterColor,
  getFilterInfoByIdx,
  FILTER_COLORS,
  FILTER_LABELS,
  getStreamTypeBadgeConfig,
  BADGE_CLASSES,
  STREAM_TYPE_SHORT_LABEL,
  DEFAULT_STREAM_COLOR,
} from '../streamType';

const BLUE = FILTER_COLORS.video; // '#3b82f6'
const GREEN = FILTER_COLORS.audio; // '#10b981'
const AMBER = FILTER_COLORS.text; // '#f59e0b'
const RED = FILTER_COLORS.file; // DEFAULT_STREAM_COLOR

describe('getFilterColor — FilterType', () => {
  it('video  → blue', () => expect(getFilterColor('video')).toBe(BLUE));
  it('audio  → green', () => expect(getFilterColor('audio')).toBe(GREEN));
  it('text   → amber', () => expect(getFilterColor('text')).toBe(AMBER));
  it('file   → red', () => expect(getFilterColor('file')).toBe(RED));
});

describe('getFilterColor — GpacStreamType produces the same color as its FilterType counterpart', () => {
  it('Visual   → blue  (same as video)', () =>
    expect(getFilterColor(GpacStreamType.Visual)).toBe(BLUE));
  it('Audio    → green (same as audio)', () =>
    expect(getFilterColor(GpacStreamType.Audio)).toBe(GREEN));
  it('Text     → amber (same as text)', () =>
    expect(getFilterColor(GpacStreamType.Text)).toBe(AMBER));
  it('File     → red   (same as file)', () =>
    expect(getFilterColor(GpacStreamType.File)).toBe(RED));
  it('Metadata (no mapping) → red fallback', () =>
    expect(getFilterColor(GpacStreamType.Metadata)).toBe(DEFAULT_STREAM_COLOR));
});

describe('getFilterColor — color consistency', () => {
  it('audio PID selected alone (index 0) is green, never blue', () => {
    expect(getFilterColor(GpacStreamType.Audio)).toBe(GREEN);
    expect(getFilterColor(GpacStreamType.Audio)).not.toBe(BLUE);
  });

  it('Visual and Audio have distinct colors', () => {
    expect(getFilterColor(GpacStreamType.Visual)).not.toBe(
      getFilterColor(GpacStreamType.Audio),
    );
  });

  it('FilterType and GpacStreamType return the same color for each pair', () => {
    expect(getFilterColor('video')).toBe(getFilterColor(GpacStreamType.Visual));
    expect(getFilterColor('audio')).toBe(getFilterColor(GpacStreamType.Audio));
    expect(getFilterColor('text')).toBe(getFilterColor(GpacStreamType.Text));
    expect(getFilterColor('file')).toBe(getFilterColor(GpacStreamType.File));
  });
});

describe('FILTER_LABELS', () => {
  it('video is labeled "Visual" (GPAC term), not "Video"', () => {
    expect(FILTER_LABELS.video).toBe('Visual');
    expect(FILTER_LABELS.video).not.toBe('Video');
  });

  it('audio, text, file keep their own name', () => {
    expect(FILTER_LABELS.audio).toBe('Audio');
    expect(FILTER_LABELS.text).toBe('Text');
    expect(FILTER_LABELS.file).toBe('File');
  });
});

describe('getStreamTypeBadgeConfig', () => {
  it('Visual → blue badge + label "V"', () => {
    const config = getStreamTypeBadgeConfig(GpacStreamType.Visual);
    expect(config.className).toBe(BADGE_CLASSES.video);
    expect(config.label).toBe(STREAM_TYPE_SHORT_LABEL[GpacStreamType.Visual]);
  });

  it('Audio → green badge + label "A"', () => {
    const config = getStreamTypeBadgeConfig(GpacStreamType.Audio);
    expect(config.className).toBe(BADGE_CLASSES.audio);
    expect(config.label).toBe('A');
  });

  it('unknown type → first char as label, file badge', () => {
    const config = getStreamTypeBadgeConfig('Unknown' as GpacStreamType);
    expect(config.label).toBe('U');
    expect(config.className).toBe(BADGE_CLASSES.file);
  });
});

function makeFilter(
  idx: number,
  ipid: GraphFilterData['ipid'],
  opid: GraphFilterData['opid'],
): GraphFilterData {
  return {
    idx,
    name: `filter-${idx}`,
    type: 'filter',
    status: '',
    itag: null,
    ID: null,
    nb_ipid: ipid.length,
    nb_opid: opid.length,
    ipid,
    opid,
  };
}

describe('getFilterInfoByIdx', () => {
  it('returns file type when filter not found', () => {
    const result = getFilterInfoByIdx([], 99);
    expect(result.streamType).toBe('file');
  });

  it('derives video from opid stream_type Visual', () => {
    const filters = [
      makeFilter(0, [], [{ pid_index: 0, name: 'vid', stream_type: 'Visual' }]),
    ];
    expect(getFilterInfoByIdx(filters, 0).streamType).toBe('video');
  });

  it('derives audio from opid stream_type Audio', () => {
    const filters = [
      makeFilter(0, [], [{ pid_index: 0, name: 'aud', stream_type: 'Audio' }]),
    ];
    expect(getFilterInfoByIdx(filters, 0).streamType).toBe('audio');
  });

  it('falls back to ipid when opid is empty', () => {
    const filters = [
      makeFilter(
        0,
        [{ pid_index: 0, name: 'aud', source_idx: 1, stream_type: 'Audio' }],
        [],
      ),
    ];
    expect(getFilterInfoByIdx(filters, 0).streamType).toBe('audio');
  });

  it('returns file when no PID has a recognized stream_type', () => {
    const filters = [
      makeFilter(0, [], [{ pid_index: 0, name: 'x', stream_type: 'File' }]),
    ];
    expect(getFilterInfoByIdx(filters, 0).streamType).toBe('file');
  });
});
