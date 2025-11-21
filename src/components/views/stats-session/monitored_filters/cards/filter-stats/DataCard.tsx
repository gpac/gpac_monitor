import { memo } from 'react';
import { LuHardDrive } from 'react-icons/lu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatBytes } from '@/utils/formatting';

interface DataCardProps {
  bytes_done?: number;
  bytes_sent?: number;
}

export const DataCard = memo(({ bytes_done, bytes_sent }: DataCardProps) => (
  <Card className="bg-monitor-panel border-transparent">
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-2 text-sm">
        <LuHardDrive className="h-4 w-4" />
        Data
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      <div className="flex justify-between">
        <span className="text-xs text-muted-foreground stat-label">Done</span>
        <span className="text-sm font-medium text-info tabular-nums">
          {formatBytes(bytes_done || 0)}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-xs text-muted-foreground stat-label">Sent</span>
        <span className="text-sm font-medium text-info tabular-nums">
          {formatBytes(bytes_sent || 0)}
        </span>
      </div>
    </CardContent>
  </Card>
));

DataCard.displayName = 'DataCard';
