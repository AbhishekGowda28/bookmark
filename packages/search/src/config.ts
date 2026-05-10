/**
 * Search configuration options
 * Defines what parameters can be customized for search behavior
 */

export interface SearchOptions {
  /**
   * Fuzzy search threshold (0-1)
   * 0 = exact match only, 1 = match anything
   * Default: 0.3 (moderate fuzziness)
   */
  threshold?: number;

  /**
   * Minimum characters required in search term to match
   * Default: 1
   */
  minMatchCharLength?: number;

  /**
   * Field weights for scoring matches
   * Higher weight = more important for ranking
   * Default: { title: 1, url: 1 }
   */
  weights?: Record<string, number>;

  /**
   * Maximum number of results to return
   * Default: unlimited
   */
  limit?: number;
}

/**
 * Default search configuration
 * These defaults provide balanced fuzzy search behavior
 */
export const DEFAULT_SEARCH_OPTIONS: Required<SearchOptions> = {
  threshold: 0.3,
  minMatchCharLength: 1,
  weights: { title: 1, url: 1 },
  limit: Number.MAX_SAFE_INTEGER,
};

/**
 * @deprecated Use SearchOptions instead - this is internal to package
 * Fuse.js configuration for fuzzy searching through bookmarks
 * Kept for backwards compatibility, but consumers should use SearchOptions
 */
export const FUSE_CONFIG = {
  keys: ['title', 'url'] as const,
  threshold: 0.3,
  minMatchCharLength: 1,
};

/**
 * @deprecated Use SearchOptions instead - this is internal to package
 * Type-safe version for Fuse.js constructor
 */
export const FUSE_OPTIONS = {
  keys: ['title', 'url'],
  threshold: 0.3,
  minMatchCharLength: 1,
};
