import { GpacLogLevel, GpacLogTool } from '@/types/domain/gpac/log-types';

/**
 * Parse a log config change string to extract individual changes
 * @param configString - Format: "all@info:core@debug:mmio@warning"
 * @returns Array of parsed config changes
 */
export function parseConfigChanges(configString: string): Array<{ tool: GpacLogTool; level: GpacLogLevel }> {
  if (!configString.trim()) return [];
  
  return configString.split(':').map(config => {
    const [tool, level] = config.split('@');
    return { tool: tool as GpacLogTool, level: level as GpacLogLevel };
  });
}