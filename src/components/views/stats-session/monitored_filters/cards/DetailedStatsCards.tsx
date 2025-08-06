import { memo } from 'react';
import { LuActivity, LuPackage2, LuHardDrive } from 'react-icons/lu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GpacNodeData } from '@/types/domain/gpac/model';
import { formatBytes, formatTime, formatNumber } from '@/utils/helper';

interface PIDMetricsCardProps {
  data: GpacNodeData;
}

export const PIDMetricsCard = memo(({ data }: PIDMetricsCardProps) => (
  <Card className="bg-stat border-transparent">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm ">PID Metrics</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold">{data.nb_ipid || 0}</div>
          <div className="text-xs text-muted-foreground stat-label">Input PIDs</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{data.nb_opid || 0}</div>
          <div className="text-xs text-muted-foreground stat-label">Output PIDs</div>
        </div>
      </div>
    </CardContent>
  </Card>
));

interface ProcessingCardProps {
  tasks?: number;
  time?: number;
}

export const ProcessingCard = memo(({ tasks, time }: ProcessingCardProps) => (
  <Card className="bg-stat border-transparent">
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-2 text-sm">
        <LuActivity className="h-4 w-4" />
        Processing
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      <div className="flex justify-between">
        <span className="text-xs text-muted-foreground stat-label">Tasks</span>
        <span className="text-sm font-medium">{tasks || 0}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-xs text-muted-foreground stat-label">Time</span>
        <span className="text-sm font-medium">{formatTime(time)}</span>
      </div>
    </CardContent>
  </Card>
));

interface PacketsCardProps {
  pck_done?: number;
  pck_sent?: number;
  pck_ifce_sent?: number;
}

export const PacketsCard = memo(
  ({ pck_done, pck_sent, pck_ifce_sent }: PacketsCardProps) => (
    <Card className="bg-stat border-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <LuPackage2 className="h-4 w-4" />
          Packets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span className="text-xs text-muted-foreground stat-label">Done</span>
          <span className="text-sm font-medium">
            {formatNumber(pck_done || 0)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-muted-foreground stat-label">Sent</span>
          <span className="text-sm font-medium">
            {formatNumber(pck_sent || 0)}
          </span>
        </div>
        {pck_ifce_sent !== undefined && (
          <div className="flex justify-between">
            <span className="text-xs text-muted-foreground stat-label">Interface Sent</span>
            <span className="text-sm font-medium">
              {formatNumber(pck_ifce_sent)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  ),
);

interface DataCardProps {
  bytes_done?: number;
  bytes_sent?: number;
}

export const DataCard = memo(({ bytes_done, bytes_sent }: DataCardProps) => (
  <Card className="bg-stat border-transparent">
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-2 text-sm">
        <LuHardDrive className="h-4 w-4" />
        Data
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      <div className="flex justify-between">
        <span className="text-xs text-muted-foreground stat-label">Done</span>
        <span className="text-sm font-medium">{formatBytes(bytes_done || 0)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-xs text-muted-foreground stat-label">Sent</span>
        <span className="text-sm font-medium">{formatBytes(bytes_sent || 0)}</span>
      </div>
    </CardContent>
  </Card>
));

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
              <span className="text-xs text-muted-foreground stat-label">Buffer</span>
              <span className="text-sm font-medium">
                {formatBytes(buffer)} / {formatBytes(buffer_total)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground stat-label">Usage</span>
              <span className="text-sm font-medium">{bufferUsage.toFixed(1)}%</span>
            </div>
          </div>

          {Object.entries(pidData)
            .filter(([key, value]) => 
              key !== 'parentFilter' && 
              value !== undefined && 
              value !== null &&
              typeof value !== 'object'
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
                    : String(value)
                  }
                </span>
              </div>
            ))}
        </CardContent>
      </Card>
    );
  },
);

PIDMetricsCard.displayName = 'PIDMetricsCard';
ProcessingCard.displayName = 'ProcessingCard';
PacketsCard.displayName = 'PacketsCard';
DataCard.displayName = 'DataCard';
PIDDetails.displayName = 'PIDDetails';