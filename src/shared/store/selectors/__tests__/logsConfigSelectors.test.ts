import { describe, it, expect } from 'vitest';
import { selectLogsConfigChanges } from '../logs/logsConfigSelectors';
import { GpacLogLevel, GpacLogTool } from '@/types/domain/gpac/log-types';

describe('logsConfigSelectors', () => {
  describe('selectLogsConfigChanges', () => {
    it('should return empty string when no changes', () => {
      const state = {
        logs: {
          levelsByTool: {
            [GpacLogTool.CORE]: GpacLogLevel.INFO,
            [GpacLogTool.FILTER]: GpacLogLevel.DEBUG,
          },
          defaultAllLevel: GpacLogLevel.WARNING,
          lastSentConfig: {
            levelsByTool: {
              [GpacLogTool.CORE]: GpacLogLevel.INFO,
              [GpacLogTool.FILTER]: GpacLogLevel.DEBUG,
            },
            defaultAllLevel: GpacLogLevel.WARNING,
          },
        },
      };

      const result = selectLogsConfigChanges(state as any);
      expect(result).toBe('');
    });

    it('should detect defaultAllLevel changes', () => {
      const state = {
        logs: {
          levelsByTool: {},
          defaultAllLevel: GpacLogLevel.DEBUG,
          lastSentConfig: {
            levelsByTool: {},
            defaultAllLevel: GpacLogLevel.WARNING,
          },
        },
      };

      const result = selectLogsConfigChanges(state as any);
      expect(result).toBe('all@debug');
    });

    it('should detect tool level changes', () => {
      const state = {
        logs: {
          levelsByTool: {
            [GpacLogTool.CORE]: GpacLogLevel.DEBUG,
          },
          defaultAllLevel: GpacLogLevel.WARNING,
          lastSentConfig: {
            levelsByTool: {
              [GpacLogTool.CORE]: GpacLogLevel.INFO,
            },
            defaultAllLevel: GpacLogLevel.WARNING,
          },
        },
      };

      const result = selectLogsConfigChanges(state as any);
      expect(result).toBe('core@debug');
    });

    it('should send all config on first subscription', () => {
      const state = {
        logs: {
          levelsByTool: {
            [GpacLogTool.CORE]: GpacLogLevel.INFO,
            [GpacLogTool.FILTER]: GpacLogLevel.DEBUG,
          },
          defaultAllLevel: GpacLogLevel.WARNING,
          lastSentConfig: {
            levelsByTool: {},
            defaultAllLevel: null,
          },
        },
      };

      const result = selectLogsConfigChanges(state as any);
      expect(result).toContain('all@warning');
      expect(result).toContain('core@info');
      expect(result).toContain('filter@debug');
    });

    it('should NOT resend unchanged tools after first config', () => {
      const state = {
        logs: {
          levelsByTool: {
            [GpacLogTool.CORE]: GpacLogLevel.INFO,
            [GpacLogTool.FILTER]: GpacLogLevel.DEBUG,
          },
          defaultAllLevel: GpacLogLevel.WARNING,
          lastSentConfig: {
            levelsByTool: {
              [GpacLogTool.CORE]: GpacLogLevel.INFO,
              [GpacLogTool.FILTER]: GpacLogLevel.DEBUG,
            },
            defaultAllLevel: GpacLogLevel.WARNING,
          },
        },
      };

      const result = selectLogsConfigChanges(state as any);
      expect(result).toBe('');
    });

    it('should send only new tools added after initial config', () => {
      const state = {
        logs: {
          levelsByTool: {
            [GpacLogTool.CORE]: GpacLogLevel.INFO,
            [GpacLogTool.FILTER]: GpacLogLevel.DEBUG,
            [GpacLogTool.HTTP]: GpacLogLevel.WARNING,
          },
          defaultAllLevel: GpacLogLevel.WARNING,
          lastSentConfig: {
            levelsByTool: {
              [GpacLogTool.CORE]: GpacLogLevel.INFO,
              [GpacLogTool.FILTER]: GpacLogLevel.DEBUG,
            },
            defaultAllLevel: GpacLogLevel.WARNING,
          },
        },
      };

      const result = selectLogsConfigChanges(state as any);
      expect(result).toBe('http@warning');
    });

    it('should detect removed tools', () => {
      const state = {
        logs: {
          levelsByTool: {
            [GpacLogTool.CORE]: GpacLogLevel.INFO,
          },
          defaultAllLevel: GpacLogLevel.WARNING,
          lastSentConfig: {
            levelsByTool: {
              [GpacLogTool.CORE]: GpacLogLevel.INFO,
              [GpacLogTool.FILTER]: GpacLogLevel.DEBUG,
            },
            defaultAllLevel: GpacLogLevel.WARNING,
          },
        },
      };

      const result = selectLogsConfigChanges(state as any);
      expect(result).toBe('filter@warning');
    });
  });
});
