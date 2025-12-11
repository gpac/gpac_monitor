import type { LayoutState } from './widgetsSlice';

const STORAGE_KEY = 'gpac_monitor_layout_v1';
const LAST_LAYOUT_KEY = 'gpac_monitor_last_layout_v1';

export function loadLayoutFromStorage(): Record<string, LayoutState> | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, LayoutState>;
  } catch {
    return {};
  }
}

export function saveLayoutsToStorage(layouts: Record<string, LayoutState>) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
  } catch {
    // Ignore write errors
  }
}

export function loadLastUsedLayout(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage.getItem(LAST_LAYOUT_KEY);
  } catch {
    return null;
  }
}

export function saveLastUsedLayout(layoutName: string | undefined) {
  if (typeof window === 'undefined') return;
  if (!layoutName) return;

  try {
    window.localStorage.setItem(LAST_LAYOUT_KEY, layoutName);
  } catch {
    // Ignore write errors
  }
}
