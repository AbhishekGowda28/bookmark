import type { Link } from '@bookmark/types';
import Fuse from 'fuse.js';
import { FUSE_CONFIG, FUSE_OPTIONS } from './config.js';

export { FUSE_CONFIG } from './config.js';

/**
 * Represents a Fuse.js searcher instance
 * Opaque type to encapsulate Fuse.js implementation details
 */
export type Searcher = Fuse<Link>;

/**
 * Create a Fuse.js searcher instance for the given links
 * This is a pure function - same input always produces equivalent output
 * 
 * @param links Array of Link objects to index
 * @returns Searcher instance ready for searching
 */
export function createSearcher(links: Link[]): Searcher {
  return new Fuse(links, FUSE_OPTIONS);
}

/**
 * Perform a fuzzy search on the indexed links
 * Returns all links if query is empty or only whitespace
 * 
 * @param searcher Fuse.js searcher instance
 * @param query Search query string
 * @returns Array of matching Link objects
 */
export function search(searcher: Searcher, query: string): Link[] {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    // Return all links indexed in the searcher
    // We extract them from the internal Fuse.js state
    const docs = searcher.getIndex().docs;
    return docs ? Array.from(docs) : [];
  }

  const results = searcher.search(trimmedQuery);
  return results.map((result) => result.item);
}

/**
 * Convenience function: create searcher and search in one call
 * Useful for one-off searches or testing
 * 
 * @param links Array of Link objects
 * @param query Search query string
 * @returns Array of matching Link objects
 */
export function searchLinks(links: Link[], query: string): Link[] {
  const searcher = createSearcher(links);
  return search(searcher, query);
}

export default { createSearcher, search, searchLinks };
