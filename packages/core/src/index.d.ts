import type { Link } from '@bookmark/types';
/**
 * Merge multiple arrays of links into a single array
 * Preserves order and combines all sources in sequence
 * @param sources Array of Link arrays to merge
 * @returns Merged Link array
 */
export declare function merge(sources: Link[][]): Link[];
/**
 * Remove duplicate links by normalized URL
 * Uses URL normalization to handle variations (trailing slash, case, etc.)
 * Keeps the first occurrence of each unique URL
 * @param links Array of Link objects
 * @returns Deduplicated array (keeps first occurrence)
 */
export declare function deduplicate(links: Link[]): Link[];
/**
 * Combine and deduplicate multiple link sources
 * Merges all arrays then removes duplicates, preserving order by source
 * @param sources Array of Link arrays to combine
 * @returns Combined and deduplicated array
 */
export declare function combine(sources: Link[][]): Link[];
/**
 * Group links by source type
 * @param links Array of Link objects
 * @returns Object with 'bookmark' and 'rss' arrays
 */
export declare function groupBySource(links: Link[]): Record<'bookmark' | 'rss', Link[]>;
/**
 * Filter links by feed name (for RSS entries)
 * @param links Array of Link objects
 * @param feedName Feed name to filter by
 * @returns Links matching the feed name
 */
export declare function filterByFeed(links: Link[], feedName: string): Link[];
declare const _default: {
  merge: typeof merge;
  deduplicate: typeof deduplicate;
  combine: typeof combine;
  groupBySource: typeof groupBySource;
  filterByFeed: typeof filterByFeed;
};
export default _default;
//# sourceMappingURL=index.d.ts.map
