import { act, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { updateSessionStats } from '@/shared/store/slices/sessionStatsSlice';
import { openSelector, renderSelector } from './detachedFilterTestStore';

describe('detached selector render isolation', () => {
  it.each([false, true])(
    'adds no render for 100 statistics ticks with menu open=%s',
    async (isOpen) => {
      const onRender = vi.fn();
      const store = renderSelector({ open: isOpen, onRender });
      if (isOpen) await screen.findByRole('menu');
      const initialCommits = onRender.mock.calls.length;
      const startedAt = performance.now();
      for (let tickIndex = 0; tickIndex < 100; tickIndex += 1) {
        act(() => {
          store.dispatch(
            updateSessionStats({
              ts_us: tickIndex * 1000000,
              stats: [
                {
                  idx: 3,
                  status: '',
                  bytes_done: tickIndex * 1024,
                  bytes_sent: 0,
                  pck_sent: 0,
                  pck_done: tickIndex,
                  time: tickIndex,
                  nb_ipid: 0,
                  nb_opid: 0,
                },
              ],
            }),
          );
        });
      }
      const elapsedMs = performance.now() - startedAt;
      const additionalCommits = onRender.mock.calls.length - initialCommits;
      console.info(
        JSON.stringify({
          menuOpen: isOpen,
          statisticsTicks: 100,
          additionalCommits,
          elapsedMs,
        }),
      );
      expect(additionalCommits).toBe(0);
      if (!isOpen) {
        expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
        openSelector();
        expect(await screen.findAllByRole('menuitem')).toHaveLength(3);
      }
    },
  );
});
