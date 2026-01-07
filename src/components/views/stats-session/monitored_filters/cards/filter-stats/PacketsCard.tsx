import { memo } from 'react';
import { LuPackage2 } from 'react-icons/lu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/utils/formatting';

interface PacketsCardProps {
  pck_done?: number;
  pck_sent?: number;
  pck_ifce_sent?: number;
}

export const PacketsCard = memo(
  ({ pck_done, pck_sent, pck_ifce_sent }: PacketsCardProps) => (
    <Card className="bg-monitor-panel/55 border-0  border-r border-monitor-line/10">
      <CardHeader className="pb-1 pt-2 px-2">
        <CardTitle className="flex items-center gap-1 text-xs font-medium">
          <LuPackage2 className="h-3 w-3" />
          Packets
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Done</span>
          <span className="font-medium text-info tabular-nums">
            m{formatNumber(pck_done || 0)}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Sent</span>
          <span className="font-medium text-info tabular-nums">
            {formatNumber(pck_sent || 0)}
          </span>
        </div>
        {pck_ifce_sent !== undefined && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Interface</span>
            <span className="font-medium text-info tabular-nums">
              {formatNumber(pck_ifce_sent)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  ),
);

PacketsCard.displayName = 'PacketsCard';
