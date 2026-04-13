import { useFilterChangeStatusLive } from './useFilterChangeStatusLive';

export function useFilterChangeStatus(filterIdx: number) {
  const live = useFilterChangeStatusLive(filterIdx);
  return live;
}
