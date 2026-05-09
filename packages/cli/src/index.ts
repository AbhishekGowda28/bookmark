import type { Link } from '@bookmark/types';

/**
 * Main orchestration function for link aggregation
 * Reads from multiple sources, merges, deduplicates, and outputs
 * @returns Promise<Link[]> - Aggregated links
 */
export async function generate(): Promise<Link[]> {
  // Placeholder - will be implemented in Issue #5
  // This will:
  // 1. Read bookmarks.xbel
  // 2. Read tabs.xbel
  // 3. Read rss-entries.json
  // 4. Parse all sources
  // 5. Merge and deduplicate
  // 6. Write data.json
  return [];
}

export default {
  generate,
};
