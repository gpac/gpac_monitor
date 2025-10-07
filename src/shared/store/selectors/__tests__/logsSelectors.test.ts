import { describe, it, expect } from 'vitest';
import { selectLogCountsByTool } from '../logsSelectors';
import {
  GpacLogLevel,
  GpacLogTool,
  GpacLogEntry,
  LOG_LEVEL_VALUES,
} from '@/types/domain/gpac/log-types';

describe('logsSelectors', () => {
  describe('selectLogCountsByTool', () => {
    it('should count only critical logs (error + warning)', () => {
      const logs: GpacLogEntry[] = [
        {
          timestamp: 1,
          tool: 'mmio',
          level: LOG_LEVEL_VALUES[GpacLogLevel.INFO],
          message: 'info log',
        },
        {
          timestamp: 2,
          tool: 'mmio',
          level: LOG_LEVEL_VALUES[GpacLogLevel.INFO],
          message: 'another info',
        },
        {
          timestamp: 3,
          tool: 'mmio',
          level: LOG_LEVEL_VALUES[GpacLogLevel.WARNING],
          message: 'warning log',
        },
        {
          timestamp: 4,
          tool: 'mmio',
          level: LOG_LEVEL_VALUES[GpacLogLevel.ERROR],
          message: 'error log',
        },
      ];

      const state = {
        logs: {
          buffers: {
            [GpacLogTool.MMIO]: logs,
          },
        },
      };

      const result = selectLogCountsByTool(state as any);
      expect(result[GpacLogTool.MMIO]).toBe(2); // Only warning + error
    });

    it('should return 0 when switching from info to warning with no warnings', () => {
      const logs: GpacLogEntry[] = [
        {
          timestamp: 1,
          tool: 'mmio',
          level: LOG_LEVEL_VALUES[GpacLogLevel.INFO],
          message: 'info log 1',
        },
        {
          timestamp: 2,
          tool: 'mmio',
          level: LOG_LEVEL_VALUES[GpacLogLevel.INFO],
          message: 'info log 2',
        },
        {
          timestamp: 3,
          tool: 'mmio',
          level: LOG_LEVEL_VALUES[GpacLogLevel.DEBUG],
          message: 'debug log',
        },
      ];

      const state = {
        logs: {
          buffers: {
            [GpacLogTool.MMIO]: logs,
          },
        },
      };

      const result = selectLogCountsByTool(state as any);
      expect(result[GpacLogTool.MMIO]).toBe(0); // No critical logs
    });

    it('should not count debug or info logs', () => {
      const logs: GpacLogEntry[] = [
        {
          timestamp: 1,
          tool: 'core',
          level: LOG_LEVEL_VALUES[GpacLogLevel.DEBUG],
          message: 'debug',
        },
        {
          timestamp: 2,
          tool: 'core',
          level: LOG_LEVEL_VALUES[GpacLogLevel.INFO],
          message: 'info',
        },
        {
          timestamp: 3,
          tool: 'core',
          level: LOG_LEVEL_VALUES[GpacLogLevel.QUIET],
          message: 'quiet',
        },
      ];

      const state = {
        logs: {
          buffers: {
            [GpacLogTool.CORE]: logs,
          },
        },
      };

      const result = selectLogCountsByTool(state as any);
      expect(result[GpacLogTool.CORE]).toBe(0);
    });

    it('should handle multiple tools independently', () => {
      const state = {
        logs: {
          buffers: {
            [GpacLogTool.MMIO]: [
              {
                timestamp: 1,
                tool: 'mmio',
                level: LOG_LEVEL_VALUES[GpacLogLevel.WARNING],
                message: 'warn',
              },
              {
                timestamp: 2,
                tool: 'mmio',
                level: LOG_LEVEL_VALUES[GpacLogLevel.INFO],
                message: 'info',
              },
            ],
            [GpacLogTool.CORE]: [
              {
                timestamp: 3,
                tool: 'core',
                level: LOG_LEVEL_VALUES[GpacLogLevel.ERROR],
                message: 'error',
              },
              {
                timestamp: 4,
                tool: 'core',
                level: LOG_LEVEL_VALUES[GpacLogLevel.ERROR],
                message: 'error2',
              },
            ],
          },
        },
      };

      const result = selectLogCountsByTool(state as any);
      expect(result[GpacLogTool.MMIO]).toBe(1); // 1 warning
      expect(result[GpacLogTool.CORE]).toBe(2); // 2 errors
    });

    it('should return 0 for empty buffers', () => {
      const state = {
        logs: {
          buffers: {
            [GpacLogTool.FILTER]: [],
          },
        },
      };

      const result = selectLogCountsByTool(state as any);
      expect(result[GpacLogTool.FILTER]).toBe(0);
    });
  });
});
