import { useDataMode } from '@/shared/hooks/data/useDataMode';

export interface SessionSourceIndicator {
  label: string;
  tone: 'live' | 'replay';
}

export const useSessionSourceIndicator = (): SessionSourceIndicator => {
  const { isHistory } = useDataMode();
  return isHistory
    ? { label: 'History', tone: 'replay' }
    : { label: 'Live', tone: 'live' };
};
