import { memo } from 'react';
import { LuHardDrive } from 'react-icons/lu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatBytes } from '@/utils/formatting';

interface DataCardProps {
  bytes_done?: number;
  bytes_sent?: number;
}

export const DataCard = memo(({ bytes_done, bytes_sent }: DataCardProps) => (
  <Card className="bg-monitor-panel/55 rounded border-0  border-r border-monitor-line/10">
    <CardHeader className="pb-1 pt-2 px-2">
      <CardTitle className="flex items-center gap-1 text-xs font-medium">
        <LuHardDrive className="h-3 w-3" />
        Data
      </CardTitle>
    </CardHeader>
    <CardContent className="p-2 space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Done</span>
        <span className="font-medium text-info tabular-nums">
          {formatBytes(bytes_done || 0)}
        </span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Sent</span>
        <span className="font-medium text-info tabular-nums">
          {formatBytes(bytes_sent || 0)}
        </span>
      </div>
    </CardContent>
  </Card>
));

DataCard.displayName = 'DataCard';
