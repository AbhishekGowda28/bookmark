import type { Link, Feed, Config } from '@bookmark/types';

/**
 * Check if two links are duplicates (same URL)
 * @param link1 First link
 * @param link2 Second link
 * @returns true if links have same URL
 */
export function isDuplicate(link1: Link, link2: Link): boolean {
  return normalizeUrl(link1.url) === normalizeUrl(link2.url);
}

/**
 * Normalize URL for comparison (remove trailing slash, lowercase)
 * @param url URL to normalize
 * @returns Normalized URL
 */
export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // Remove trailing slash and lowercase
    let pathname = u.pathname;
    if (pathname.endsWith('/') && pathname.length > 1) {
      pathname = pathname.slice(0, -1);
    }
    return `${u.protocol}//${u.hostname}${pathname}${u.search}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

/**
 * Validate a Link object
 * @param link Object to validate
 * @returns true if valid Link
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
 * @param feed Object to validate
 * @returns true if valid Feed
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
 * Validate a Config object
 * @param config Object to validate
 * @returns true if valid Config
 */
export function validateConfig(config: unknown): config is Config {
  if (typeof config !== 'object' || config === null) return false;
  const c = config as Record<string, unknown>;
  if (!Array.isArray(c.feeds)) return false;
  return c.feeds.every((feed) => validateFeed(feed));
}

/**
 * Format URL for display
 * @param url URL to format
 * @returns Formatted URL (hostname + path)
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
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Generate UUID v4
 * @returns Generated UUID
 */
export function generateId(): string {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Ensure Link has valid ID and matches discriminated union contract
 * Returns BookmarkLink by default, or RssLink if feed is provided
 * @param link Link to normalize
 * @returns Link with guaranteed ID
 */
export function ensureLink(link: Partial<Link>): Link {
  const source = link.source || 'bookmark';
  const id = link.id || generateId();
  const title = link.title || 'Untitled';
  const url = link.url || '';

  if (source === 'rss' && 'feed' in link && link.feed) {
    // Return RssLink
    return {
      id,
      title,
      url,
      source: 'rss',
      feed: link.feed,
      author: link.author,
      tags: link.tags,
      addedAt: link.addedAt,
      metadata: link.metadata,
    };
  } else {
    // Return BookmarkLink
    return {
      id,
      title,
      url,
      source: 'bookmark',
      author: link.author,
      tags: link.tags,
      addedAt: link.addedAt,
      metadata: link.metadata,
    };
  }
}
