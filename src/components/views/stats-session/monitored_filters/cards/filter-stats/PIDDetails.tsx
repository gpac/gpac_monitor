import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatBytes } from '@/utils/helper';

interface PIDDetailsProps {
  name: string;
  buffer: number;
  buffer_total: number;
  source_idx?: number;
  codec?: string;
  [key: string]: any;
}

export const PIDDetails = memo(
  ({ name, buffer, buffer_total, codec, ...pidData }: PIDDetailsProps) => {
    const bufferUsage = buffer_total > 0 ? (buffer / buffer_total) * 100 : 0;

    return (
      <Card className="bg-stat border-transparent">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{name}</CardTitle>
            {codec && <Badge variant="outline">{codec}</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground stat-label">
                Buffer
              </span>
              <span className="text-sm font-medium">
                {formatBytes(buffer)} / {formatBytes(buffer_total)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground stat-label">
                Usage
              </span>
              <span className="text-sm font-medium">
                {bufferUsage.toFixed(1)}%
              </span>
            </div>
          </div>

          {Object.entries(pidData)
            .filter(
              ([key, value]) =>
                key !== 'parentFilter' &&
                value !== undefined &&
                value !== null &&
                typeof value !== 'object',
            )
            .slice(0, 4)
            .map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-xs text-muted-foreground capitalize">
                  {key.replace('_', ' ')}
                </span>
                <span className="text-sm font-medium">
                  {typeof value === 'number'
                    ? value > 1000000
                      ? formatBytes(value)
                      : value.toLocaleString()
                    : String(value)}
                </span>
              </div>
            ))}
        </CardContent>
      </Card>
    );
  },
);

PIDDetails.displayName = 'PIDDetails';
