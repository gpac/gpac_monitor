import { GpacLogTool } from '@/types/domain/gpac/log-types';

/**
 * Simple boolean-based tool filtering logic
 */

/**
 * Handles ALL checkbox toggle
 * @param isAllChecked current ALL state
 * @returns new ALL state
 */
export function toggleAll(isAllChecked: boolean): boolean {
  return !isAllChecked;
}

/**
 * Handles individual tool checkbox toggle
 * @param tool the tool being toggled
 * @param toolsChecked current checked tools array
 * @returns new checked tools array
 */
export function toggleTool(
  tool: GpacLogTool,
  toolsChecked: GpacLogTool[]
): GpacLogTool[] {
  if (!toolsChecked) return [tool];
  
  const isChecked = toolsChecked.includes(tool);
  
  if (isChecked) {
    // Remove tool from checked list
    return toolsChecked.filter(t => t !== tool);
  } else {
    // Add tool to checked list
    return [...toolsChecked, tool];
  }
}

/**
 * Determines which tools to display based on filter state
 * @param isAllChecked whether ALL is checked
 * @param toolsChecked array of individually checked tools
 * @param currentTool currently selected tool
 * @returns array of tools that should be visible
 */
export function getVisibleTools(
  isAllChecked: boolean,
  toolsChecked: GpacLogTool[],
  currentTool: GpacLogTool
): GpacLogTool[] {
  if (isAllChecked) {
    // ALL mode: return empty array (will be handled to show all)
    return [];
  } else if (toolsChecked && toolsChecked.length > 0) {
    // Some tools checked: return checked tools
    return toolsChecked;
  } else {
    // No tools checked: return current tool only
    return [currentTool];
  }
}

/**
 * Calculates filtered log count
 * @param visibleTools array of visible tools
 * @param logCountsByTool log counts per tool
 * @param configuredTools all configured tools (for ALL mode)
 * @param isAllChecked whether ALL is checked
 * @returns total count of visible logs
 */
export function calculateLogCount(
  visibleTools: GpacLogTool[],
  logCountsByTool: Record<string, number>,
  configuredTools: GpacLogTool[],
  isAllChecked: boolean
): number {
  const toolsToCount = isAllChecked ? configuredTools : visibleTools;
  
  return toolsToCount.reduce((total, tool) => {
    return total + (logCountsByTool[tool] || 0);
  }, 0);
}

/**
 * Gets display label for the badge
 * @param isAllChecked whether ALL is checked
 * @param toolsChecked array of checked tools
 * @param currentTool current tool
 * @returns display label
 */
export function getDisplayLabel(
  isAllChecked: boolean,
  toolsChecked: GpacLogTool[],
  currentTool: GpacLogTool
): string {
  if (isAllChecked) {
    return 'ALL';
  } else if (toolsChecked && toolsChecked.length > 1) {
    return toolsChecked.map(t => t.toUpperCase()).join(',');
  } else if (toolsChecked && toolsChecked.length === 1) {
    return toolsChecked[0].toUpperCase();
  } else {
    return currentTool.toUpperCase();
  }
}