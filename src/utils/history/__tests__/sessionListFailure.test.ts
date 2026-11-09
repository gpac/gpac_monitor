import { describe, it, expect } from 'vitest';
import { classifySessionListFailure } from '../sessionListFailure';

describe('classifySessionListFailure', () => {
  it('classifies a socket error event as no-gpac', () => {
    expect(classifySessionListFailure(new Event('error'))).toBe('no-gpac');
  });

  it('classifies a socket closed during the request as no-gpac', () => {
    expect(classifySessionListFailure(new Error('WebSocket closed'))).toBe(
      'no-gpac',
    );
  });

  it('classifies a request sent without a socket as no-gpac', () => {
    expect(
      classifySessionListFailure(
        new Error('WsSessionFileReader: not connected'),
      ),
    ).toBe('no-gpac');
  });

  it('classifies a server error response as list-failed', () => {
    expect(
      classifySessionListFailure(new Error('Cannot read history folder')),
    ).toBe('list-failed');
  });
});
