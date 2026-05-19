/**
 * Shared CSS class constants for all filter stats tabs
 * Ensures visual consistency and prevents re-render by memoizing classes
 */

export const TAB_STYLES = {
  // Container
  TAB_CONTAINER: 'flex flex-col h-full gap-2 p-2',

  // Status Bar
  STATUS_BAR:
    'flex items-center gap-2 px-3 py-2 bg-monitor-panel/40 rounded border-b border-monitor-line/10 text-xs shrink-0',
  STATUS_SEPARATOR: 'text-muted-foreground/50',
  STATUS_LABEL: 'text-muted-foreground',
  STATUS_VALUE: 'font-medium text-info tabular-nums',
  LIVE_INDICATOR: 'ml-auto text-muted-foreground/70 text-xs',

  // Cards
  COMPACT_CARD:
    'bg-monitor-panel/60 border-r border-monitor-line/10 rounded p-2',
  CARD_TITLE_SMALL: 'text-xs font-medium text-info mb-1',

  // Metrics
  METRIC_ROW: 'flex justify-between text-xs',
  METRIC_LABEL: 'text-muted-foreground',
  METRIC_VALUE: 'font-medium text-info tabular-nums',

  // Grid
  GRID_3_COL: 'grid grid-cols-3 gap-2 shrink-0',
  GRID_2_COL: 'grid grid-cols-2 gap-2',
  GRID_AUTO_FIT:
    'grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-2 shrink-0',

  // Spacing
  SPACE_Y_2: 'space-y-2',

  // Badges
  BADGE_TINY: 'text-[10px] px-1.5 py-0 h-5 tabular-nums',
  TABLE_HEADER:
    'px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide',

  // Status badges
  STATUS_BAR_CONTAINER: 'bg-background/30 rounded-lg px-3 py-2',
  STATUS_BAR_CONTENT: 'flex items-center justify-between',
  STATUS_BAR_LEFT: 'flex items-center gap-3',
  STATUS_BAR_RIGHT: 'flex items-center gap-1.5',
} as const;
