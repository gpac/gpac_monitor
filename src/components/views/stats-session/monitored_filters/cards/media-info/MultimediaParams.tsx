import { memo } from 'react';
import { LuFilm, LuMusic, LuSettings } from 'react-icons/lu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { TabPIDData } from '@/types/domain/gpac/filter-stats';
import { formatMultimediaValue, getCodecBadgeVariant } from './formatters';
import { getMediaIcon, groupParameters, hasValidData } from './helpers';

interface MultimediaParamsProps {
  pidData: TabPIDData;
}

/**
 * Component displaying multimedia parameters in collapsible accordion format
 * Shows codec, format, resolution, audio params, and technical specifications
 */
export const MultimediaParams = memo(({ pidData }: MultimediaParamsProps) => {
  const MediaIcon = getMediaIcon(pidData);
  const { videoParams, audioParams, technicalParams } =
    groupParameters(pidData);

  // Check if sections have any meaningful data
  const hasVideoData = hasValidData(videoParams);
  const hasAudioData = hasValidData(audioParams);
  const hasTechnicalData = hasValidData(technicalParams);

  // Render parameter row
  const renderParam = (
    label: string,
    key: string,
    value: any,
    showBadge: boolean = false,
  ) => {
    if (value === undefined || value === null) return null;

    return (
      <div key={key} className="flex justify-between items-center py-1">
        <span className="text-xs text-muted-foreground capitalize stat-label">
          {label.replace('_', ' ')}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {formatMultimediaValue(key, value)}
          </span>
          {showBadge && key === 'codec' && (
            <Badge variant={getCodecBadgeVariant(value as string)}>
              {String(value).toUpperCase()}
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-stat border-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <MediaIcon className="h-4 w-4" />
          Multimedia Parameters
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <Accordion defaultExpanded={[]}>
          {/* Video Parameters Section */}
          {hasVideoData &&
            (pidData.width || pidData.height || pidData.pixelformat) && (
              <AccordionItem value="video" title="Video Parameters">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-2">
                    <LuFilm className="h-3 w-3" />
                    <span className="text-xs font-medium">Video</span>
                    {videoParams.resolution && (
                      <Badge variant="outline" className="text-xs">
                        {videoParams.resolution}
                      </Badge>
                    )}
                  </div>
                  {renderParam('Codec', 'codec', videoParams.codec, false)}
                  {renderParam(
                    'Resolution',
                    'resolution',
                    videoParams.resolution,
                  )}
                  {renderParam(
                    'Pixel Format',
                    'pixelformat',
                    videoParams.pixelformat,
                  )}
                </div>
              </AccordionItem>
            )}

          {/* Audio Parameters Section */}
          {hasAudioData && (pidData.samplerate || pidData.channels) && (
            <AccordionItem value="audio" title="Audio Parameters">
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <LuMusic className="h-3 w-3" />
                  <span className="text-xs font-medium">Audio</span>
                  {audioParams.channels && (
                    <Badge variant="outline" className="text-xs">
                      {audioParams.channels}ch
                    </Badge>
                  )}
                </div>
                {renderParam('Codec', 'codec', audioParams.codec, true)}
                {renderParam(
                  'Sample Rate',
                  'samplerate',
                  audioParams.samplerate,
                )}
                {renderParam('Channels', 'channels', audioParams.channels)}

                <div className="flex items-center gap-2 mb-2">
                  <LuSettings className="h-3 w-3" />
                  <span className="text-xs font-medium">Technical</span>
                  {technicalParams.type && (
                    <Badge variant="outline" className="text-xs">
                      {technicalParams.type}
                    </Badge>
                  )}
                </div>
                {renderParam('Type', 'type', technicalParams.type)}
                {renderParam(
                  'Timescale',
                  'timescale',
                  technicalParams.timescale,
                )}
              </div>
            </AccordionItem>
          )}
        </Accordion>

        {/* Show message if no multimedia parameters are available */}
        {!hasVideoData && !hasAudioData && !hasTechnicalData && (
          <div className="py-4 text-center text-muted-foreground text-xs">
            No multimedia parameters available
          </div>
        )}
      </CardContent>
    </Card>
  );
});

MultimediaParams.displayName = 'MultimediaParams';
