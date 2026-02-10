/**
 * Extract basename from a path or filename
 * Supports both / and \ separators
 */
export function getBasename(pathOrName: string): string {
  if (!pathOrName) return '';

  const normalizedPath = pathOrName.replace(/\\/g, '/');
  const segments = normalizedPath.split('/');
  return segments[segments.length - 1];
}

/**
 * Truncate string in the middle, keeping start and end visible
 * Example: "very_long_filename.txt" -> "very_long...name.txt"
 */
export function truncateMiddle(str: string, maxLen: number): string {
  if (!str || str.length <= maxLen) return str;

  const startLen = Math.ceil(maxLen / 2) - 2;
  const endLen = Math.floor(maxLen / 2) - 2;

  return `${str.slice(0, startLen)}...${str.slice(-endLen)}`;
}
