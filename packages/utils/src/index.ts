import type { Link, Feed, FeedSource, RssEntry } from '@bookmark/types';

/**
 * Check if two links are duplicates (same URL)
 */
export function isDuplicate(link1: Link, link2: Link): boolean {
  return link1.url === link2.url;
}

/**
 * Validate a Link object
 */
export function validateLink(link: unknown): link is Link {
  if (typeof link !== 'object' || link === null) return false;
  const l = link as Record<string, unknown>;
  return (
    typeof l.id === 'string' &&
    typeof l.title === 'string' &&
    typeof l.url === 'string' &&
    (l.source === 'bookmark' || l.source === 'rss') &&
    (l.feed === undefined || typeof l.feed === 'string')
  );
}

/**
 * Validate a Feed object
 */
export function validateFeed(feed: unknown): feed is Feed {
  if (typeof feed !== 'object' || feed === null) return false;
  const f = feed as Record<string, unknown>;
  return (
    typeof f.id === 'string' &&
    typeof f.author === 'string' &&
    typeof f.authorMaxEntries === 'number' &&
    Array.isArray(f.sources)
  );
}

/**
 * Format URL for display
 */
export function formatUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname + (u.pathname !== '/' ? u.pathname : '');
  } catch {
    return url;
  }
}

/**
 * Format date string
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
