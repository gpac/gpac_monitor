import type { LayoutState } from './widgetsSlice';

const STORAGE_KEY = 'gpac_monitor_layout_v1';

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
