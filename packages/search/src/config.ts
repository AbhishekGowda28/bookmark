/**
 * Fuse.js configuration for fuzzy searching through bookmarks
 * Centralized to ensure consistency across all consumers
 */

export const FUSE_CONFIG = {
  keys: ['title', 'url'] as const,
  threshold: 0.3,
  minMatchCharLength: 1,
};

// Export a type-safe version for Fuse.js constructor
export const FUSE_OPTIONS = {
  keys: ['title', 'url'],
  threshold: 0.3,
  minMatchCharLength: 1,
};
