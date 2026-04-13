import { useAppSelector } from './redux';
import { selectFilterAlerts } from '@/shared/store/selectors/header/headerSelectors';

export interface FilterAlertStatus {
  hasError: boolean;
  hasWarning: boolean;
}

export function useFilterAlerts(filterIdx: number): FilterAlertStatus {
  const alerts = useAppSelector((state) =>
    selectFilterAlerts(String(filterIdx))(state),
  );
  return {
    hasError: (alerts?.errors ?? 0) > 0,
    hasWarning: (alerts?.warnings ?? 0) > 0,
  };
}
