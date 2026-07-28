import { useMemo } from 'react';
import { useDataSource } from '@/services/dataSource/DataSourceContext';
import { historyController } from './historyController';
import type { TimelineEvent } from './types';

export function useTimelineEvents(): TimelineEvent[] {
  const { manifest } = useDataSource();

  return useMemo(
    () => (manifest ? historyController.getTimelineEvents() : []),
    [manifest],
  );
}
