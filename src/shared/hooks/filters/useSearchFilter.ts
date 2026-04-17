import { useMemo } from 'react';

/**
 * Generic hook to filter a list of items based on a search query.
 *
 * @template T - The type of items to filter
 * @param items - The list of items to filter
 * @param searchQuery - The search query string
 * @param getSearchTerms - Function to extract searchable terms from an item
 * @returns Filtered list of items
 *
 * @example
 * // Filter tools by display name
 * const filteredTools = useSearchFilter(
 *   tools,
 *   searchQuery,
 *   (tool) => [tool.name, tool.displayName]
 * );
 *
 * @example
 * // Filter arguments by name and description
 * const filteredArgs = useSearchFilter(
 *   arguments,
 *   searchQuery,
 *   (arg) => [arg.name, arg.description]
 * );
 */
export function useSearchFilter<T>(
  items: T[],
  searchQuery: string,
  getSearchTerms: (item: T) => string[],
): T[] {
  return useMemo(() => {
    if (!searchQuery.trim()) return items;

    const lowerQuery = searchQuery.toLowerCase();

    return items.filter((item) => {
      const searchTerms = getSearchTerms(item);
      return searchTerms.some((term) =>
        term.toLowerCase().includes(lowerQuery),
      );
    });
  }, [items, searchQuery, getSearchTerms]);
}
