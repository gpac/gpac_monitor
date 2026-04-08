import { useDataMode } from '@/shared/hooks/useDataMode';
import { useFilterChangeStatusLive } from './useFilterChangeStatusLive';
import { useFilterChangeStatusHistory } from './useFilterChangeStatusHistory';

export function useFilterChangeStatus(filterIdx: number) {
  const { isLive } = useDataMode();
  const live = useFilterChangeStatusLive(filterIdx, isLive);
  const history = useFilterChangeStatusHistory(filterIdx, !isLive);

  return isLive ? live : history;
}
