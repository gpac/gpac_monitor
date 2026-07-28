import { useAppSelector } from '../redux';
import { selectAllFilterAlerts } from '@/shared/store/selectors/header/headerSelectors';

export interface FilterAlertStatus {
  hasError: boolean;
  hasWarning: boolean;
}

export function useFilterAlerts(filterIdx: number): FilterAlertStatus {
  const alerts = useAppSelector(
    (state) => selectAllFilterAlerts(state)[String(filterIdx)] ?? null,
  );
  return {
    hasError: (alerts?.errors ?? 0) > 0,
    hasWarning: (alerts?.warnings ?? 0) > 0,
  };
}
