import type { Link } from '@bookmark/types';
import { isDuplicate } from '@bookmark/utils';

/**
 * Merge multiple arrays of links into a single array
 * @param sources Array of Link arrays to merge
 * @returns Merged Link array
 */
export function merge(sources: Link[][]): Link[] {
  // Placeholder - will be implemented in Issue #4
  // This will combine all link arrays while preserving order
  return sources.flat();
}

/**
 * Remove duplicate links by URL
 * @param links Array of Link objects
 * @returns Deduplicated array (keeps first occurrence)
 */
export function deduplicate(links: Link[]): Link[] {
  // Placeholder - will be implemented in Issue #4
  const seen = new Set<string>();
  return links.filter((link) => {
    if (seen.has(link.url)) return false;
    seen.add(link.url);
    return true;
  });
}

export default {
  merge,
  deduplicate,
};
