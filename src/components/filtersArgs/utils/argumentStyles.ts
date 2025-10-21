/**
 * Get border style class based on argument hint level
 */
export const getBorderStyle = (hint?: string): string => {
  const hintLower = hint?.toLowerCase();

  if (hintLower === 'expert') {
    return 'border-l-2 border-l-red-500';
  }
  if (hintLower === 'advanced') {
    return 'border-l-2 border-l-orange-500';
  }
  return '';
};
