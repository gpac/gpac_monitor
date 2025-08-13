import { memo } from 'react';
import { LuFilm, LuMusic, LuSettings } from 'react-icons/lu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { TabPIDData } from '@/types/domain/gpac/filter-stats';
import { TimeFraction } from '@/types/domain/gpac/model';

interface MultimediaParamsProps {
  pidData: TabPIDData;
}

/**
 * Component displaying multimedia parameters in collapsible accordion format
 * Shows codec, format, resolution, audio params, and technical specifications
 */
export const MultimediaParams = memo(({ pidData }: MultimediaParamsProps) => {
  // Format fps from TimeFraction
  const formatFPS = (fps?: TimeFraction) => {
    if (
      !fps ||
      typeof fps !== 'object' ||
      !('num' in fps) ||
      !('den' in fps) ||
      fps.den === 0
    )
      return 'N/A';
    return `${(fps.num / fps.den).toFixed(2)} fps`;
  };

  // Format resolution
  const getResolution = () => {
    if (pidData.width && pidData.height) {
      return `${pidData.width}x${pidData.height}`;
    }
    return null;
  };

  // Get codec badge variant
  const getCodecBadgeVariant = (codec: string | undefined) => {
    if (!codec) return 'outline';
    const lowerCodec = codec.toLowerCase();
    if (lowerCodec.includes('h264') || lowerCodec.includes('avc'))
      return 'default';
    if (lowerCodec.includes('h265') || lowerCodec.includes('hevc'))
      return 'secondary';
    if (lowerCodec.includes('av1')) return 'default';
    return 'outline';
  };

  // Determine media type icon
  const getMediaIcon = () => {
    if (pidData.width && pidData.height) return LuFilm;
    if (pidData.samplerate || pidData.channels) return LuMusic;
    return LuSettings;
  };

  const MediaIcon = getMediaIcon();

  // Group parameters by category
  const videoParams = {
    codec: pidData.codec,
    resolution: getResolution(),
    pixelformat: pidData.pixelformat,
  };

  const audioParams = {
    codec: pidData.codec,
    samplerate: pidData.samplerate,
    channels: pidData.channels,
  };

  const technicalParams = {
    type: pidData.type,
    timescale: pidData.timescale,
  };

  // Check if section has any meaningful data
  const hasVideoData = Object.values(videoParams).some(
    (val) => val !== undefined && val !== null,
  );
  const hasAudioData = Object.values(audioParams).some(
    (val) => val !== undefined && val !== null,
  );
  const hasTechnicalData = Object.values(technicalParams).some(
    (val) => val !== undefined && val !== null,
  );

  // Format parameter value for display
  const formatValue = (key: string, value: any) => {
    if (value === undefined || value === null) return 'N/A';

    switch (key) {
      case 'fps':
        return formatFPS(value as TimeFraction);
      case 'bitrate':
        return typeof value === 'number'
          ? `${(value / 1000).toFixed(0)} kb/s`
          : String(value);
      case 'duration':
        return typeof value === 'number'
          ? `${(value / 1000).toFixed(2)}s`
          : String(value);
      case 'samplerate':
        return typeof value === 'number'
          ? `${(value / 1000).toFixed(1)} kHz`
          : String(value);
      case 'timescale':
        return typeof value === 'number'
          ? value.toLocaleString()
          : String(value);
      default:
        return String(value);
    }
  };

  // Render parameter row
  const renderParam = (
    label: string,
    key: string,
    value: any,
    showBadge: boolean = false,
  ) => {
    if (value === undefined || value === null) return null;

    return (
      <div key={key} className="flex justify-between items-center py-1 ">
        <span className="text-xs text-muted-foreground capitalize stat-label">
          {label.replace('_', ' ')}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{formatValue(key, value)}</span>
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
