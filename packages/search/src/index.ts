import type { Link } from '@bookmark/types';
import Fuse from 'fuse.js';
import type { SearchOptions } from './config.js';
import { DEFAULT_SEARCH_OPTIONS } from './config.js';

export { FUSE_CONFIG } from './config.js';
export type { SearchOptions } from './config.js';

/**
 * Opaque searcher type - encapsulates Fuse.js implementation
 * Users cannot directly access internal Fuse.js instance
 * Only interact with searcher through public search functions
 */
export class Searcher {
  private readonly fuse: Fuse<Link>;
  private readonly links: Link[];
  private readonly options: Required<SearchOptions>;

  constructor(links: Link[], options: SearchOptions = {}) {
    this.links = links;
    this.options = { ...DEFAULT_SEARCH_OPTIONS, ...options };

    // Create Fuse.js instance with normalized options
    this.fuse = new Fuse(links, {
      keys: ['title', 'url'],
      threshold: this.options.threshold,
      minMatchCharLength: this.options.minMatchCharLength,
    });
  }

  /**
   * Get the links this searcher indexes (for internal use)
   * @internal
   */
  getLinks(): Link[] {
    return this.links;
  }

  /**
   * Get the search options for this instance
   * @internal
   */
  getOptions(): Readonly<Required<SearchOptions>> {
    return Object.freeze(this.options);
  }

  /**
   * Internal Fuse.js instance access (for search implementation)
   * @internal
   */
  getFuseInstance(): Fuse<Link> {
    return this.fuse;
  }
}

/**
 * Create a searcher instance for the given links with optional configuration
 * 
 * @param links Array of Link objects to index
 * @param options Optional search configuration (threshold, weights, limits)
 * @returns Searcher instance ready for searching
 * 
 * @example
 * const searcher = createSearcher(myLinks, { threshold: 0.5 });
 * const results = search(searcher, 'my query');
 */
export function createSearcher(links: Link[], options?: SearchOptions): Searcher {
  return new Searcher(links, options);
}

/**
 * Perform a fuzzy search on indexed links
 * Returns all links if query is empty or only whitespace
 * 
 * @param searcher Searcher instance
 * @param query Search query string
 * @param options Optional per-query overrides (limit, etc.)
 * @returns Array of matching Link objects up to configured limit
 */
export function search(searcher: Searcher, query: string, options?: Partial<SearchOptions>): Link[] {
  const trimmedQuery = query.trim();
  const mergedOptions = { ...searcher.getOptions(), ...options };

  // Return empty query results as all indexed links
  if (!trimmedQuery) {
    const links = searcher.getLinks();
    return links.slice(0, mergedOptions.limit);
  }

  // Access Fuse.js instance for search (internal implementation detail)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fuseSearcher = (searcher as any).fuse as Fuse<Link>;
  const results = fuseSearcher.search(trimmedQuery);
  const items = results.map((result) => result.item);

  return items.slice(0, mergedOptions.limit);
}

/**
 * Convenience function: create searcher and search in one call
 * Useful for one-off searches or testing where searcher reuse isn't needed
 * 
 * @param links Array of Link objects
 * @param query Search query string
 * @param options Optional search configuration
 * @returns Array of matching Link objects
 */
export function searchLinks(
  links: Link[],
  query: string,
  options?: SearchOptions
): Link[] {
  const searcher = createSearcher(links, options);
  return search(searcher, query);
}

export default { createSearcher, search, searchLinks };
