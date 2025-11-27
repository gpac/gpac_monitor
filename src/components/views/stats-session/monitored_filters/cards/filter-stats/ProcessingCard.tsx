import { memo } from 'react';
import { LuActivity } from 'react-icons/lu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTime } from '@/utils/formatting';
import { metricValueFont, metricLabelFont } from '@/utils/responsiveFonts';

interface ProcessingCardProps {
  tasks?: number;
  time?: number;
}

export const ProcessingCard = memo(({ tasks, time }: ProcessingCardProps) => (
  <Card className="bg-monitor-panel border-transparent">
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-2 text-sm">
        <LuActivity className="h-4 w-4" />
        Processing
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      <div className="flex justify-between">
        <span className={`${metricLabelFont} text-muted-foreground stat-label`}>
          Tasks
        </span>
        <span
          className={`${metricValueFont} font-medium text-info tabular-nums`}
        >
          {tasks || 0}
        </span>
      </div>
      <div className="flex justify-between">
        <span className={`${metricLabelFont} text-muted-foreground stat-label`}>
          Time
        </span>
        <span
          className={`${metricValueFont} font-medium text-info tabular-nums`}
        >
          {formatTime(time)}
        </span>
      </div>
    </CardContent>
  </Card>
));

ProcessingCard.displayName = 'ProcessingCard';
