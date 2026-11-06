export type SessionListFailure = 'no-gpac' | 'list-failed';

const TRANSPORT_FAILURE_MESSAGES = [
  'WebSocket closed',
  'WsSessionFileReader: not connected',
];

export function classifySessionListFailure(
  reason: unknown,
): SessionListFailure {
  if (!(reason instanceof Error)) return 'no-gpac';
  return TRANSPORT_FAILURE_MESSAGES.includes(reason.message)
    ? 'no-gpac'
    : 'list-failed';
}
