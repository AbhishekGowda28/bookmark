import type { Link } from '@bookmark/types';
import { normalizeUrl } from '@bookmark/validation';

/**
 * Merge multiple arrays of links into a single array
 * Preserves order and combines all sources in sequence
 * @param sources Array of Link arrays to merge
 * @returns Merged Link array
 */
export function merge(sources: Link[][]): Link[] {
  return sources.flat();
}

/**
 * Remove duplicate links by normalized URL
 * Uses URL normalization to handle variations (trailing slash, case, etc.)
 * Keeps the first occurrence of each unique URL
 * @param links Array of Link objects
 * @returns Deduplicated array (keeps first occurrence)
 */
export function deduplicate(links: Link[]): Link[] {
  const seen = new Set<string>();
  return links.filter((link) => {
    const normalizedUrl = normalizeUrl(link.url);
    if (seen.has(normalizedUrl)) return false;
    seen.add(normalizedUrl);
    return true;
  });
}

/**
 * Combine and deduplicate multiple link sources
 * Merges all arrays then removes duplicates, preserving order by source
 * @param sources Array of Link arrays to combine
 * @returns Combined and deduplicated array
 */
export function combine(sources: Link[][]): Link[] {
  return deduplicate(merge(sources));
}

/**
 * Group links by source type
 * @param links Array of Link objects
 * @returns Object with 'bookmark' and 'rss' arrays
 */
export function groupBySource(links: Link[]): Record<'bookmark' | 'rss', Link[]> {
  return {
    bookmark: links.filter((link) => link.source === 'bookmark'),
    rss: links.filter((link) => link.source === 'rss'),
  };
}

/**
 * Filter links by feed name (for RSS entries)
 * @param links Array of Link objects
 * @param feedName Feed name to filter by
 * @returns Links matching the feed name
 */
export function filterByFeed(links: Link[], feedName: string): Link[] {
  return links.filter((link) => link.feed === feedName);
}

export default {
  merge,
  deduplicate,
  combine,
  groupBySource,
  filterByFeed,
};
