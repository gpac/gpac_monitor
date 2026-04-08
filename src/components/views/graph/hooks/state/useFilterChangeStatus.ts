import { useDataMode } from '@/shared/hooks/useDataMode';
import { useFilterChangeStatusLive } from './useFilterChangeStatusLive';
import { useFilterChangeStatusHistory } from './useFilterChangeStatusHistory';

export function useFilterChangeStatus(filterIdx: number) {
  const { isLive } = useDataMode();
  const live = useFilterChangeStatusLive(filterIdx);
  const history = useFilterChangeStatusHistory(filterIdx);

  return isLive ? live : history;
}
