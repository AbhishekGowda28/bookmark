import type { Link, RssEntry } from '@bookmark/types';
import { isLink, generateId } from '@bookmark/validation';

/**
 * Convert RSS entries to Link format
 * @param entries RSS entries from workflow
 * @returns Array of Link objects
 */
export async function parseRssEntries(entries: RssEntry[]): Promise<Link[]> {
  return entries
    .map((entry) => ({
      id: generateId(),
      title: entry.title,
      url: entry.url,
      source: 'rss' as const,
      feed: entry.author,
    }))
    .filter(isLink);
}
