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
    <Card className="bg-monitor-panel border-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <LuPackage2 className="h-4 w-4" />
          Packets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span className="text-xs text-muted-foreground stat-label">Done</span>
          <span className="text-sm font-medium text-info tabular-nums">
            {formatNumber(pck_done || 0)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-muted-foreground stat-label">Sent</span>
          <span className="text-sm font-medium text-info tabular-nums">
            {formatNumber(pck_sent || 0)}
          </span>
        </div>
        {pck_ifce_sent !== undefined && (
          <div className="flex justify-between">
            <span className="text-xs text-muted-foreground stat-label">
              Interface Sent
            </span>
            <span className="text-sm font-medium text-info tabular-nums">
              {formatNumber(pck_ifce_sent)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  ),
);

PacketsCard.displayName = 'PacketsCard';
