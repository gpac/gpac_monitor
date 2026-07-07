import type { GraphInputPid, GraphOutputPid } from '@/types/domain/gpac/model';

type PidEntry = GraphInputPid | GraphOutputPid;

export function arePidListsEqual(a: PidEntry[], b: PidEntry[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].pid_index !== b[i].pid_index ||
      a[i].name !== b[i].name ||
      a[i].stream_type !== b[i].stream_type
    ) {
      return false;
    }
  }
  return true;
}
