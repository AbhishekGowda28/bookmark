/**
 * Metadata object for Link extensibility
 * Supports adding Phase 2 features (notes, tags, read status, etc.) without breaking types
 */
export interface LinkMetadata {
  [key: string]: unknown; // Allow any extensible metadata
}

/**
 * Bookmark link - from browser bookmarks or tabs
 * Discriminator: source === 'bookmark'
 */
export interface BookmarkLink {
  id: string;
  title: string;
  url: string;
  source: 'bookmark';
  // feed NOT present for bookmarks
  feed?: never; // Explicitly prevent feed field
  author?: string; // Optional author field for future use
  tags?: string[]; // Optional tags for categorization
  addedAt?: string; // ISO8601 timestamp
  metadata?: LinkMetadata; // Extensible metadata for Phase 2
}

/**
 * RSS link - from RSS feed entries
 * Discriminator: source === 'rss'
 */
export interface RssLink {
  id: string;
  title: string;
  url: string;
  source: 'rss';
  feed: string; // Feed name - REQUIRED for RSS links
  author?: string; // Optional author from RSS entry
  tags?: string[]; // Optional tags from RSS entry
  addedAt?: string; // ISO8601 timestamp
  metadata?: LinkMetadata; // Extensible metadata for Phase 2
}

/**
 * Link - discriminated union of BookmarkLink and RssLink
 * Type-safe: ensures feed field only present when source === 'rss'
 */
export type Link = BookmarkLink | RssLink;

/**
 * Type guard to check if Link is a bookmark
 */
export function isBookmarkLink(link: Link): link is BookmarkLink {
  return link.source === 'bookmark';
}

/**
 * Type guard to check if Link is an RSS link
 */
export function isRssLink(link: Link): link is RssLink {
  return link.source === 'rss' && 'feed' in link && link.feed !== undefined;
}

// Feed configuration interface
export interface Feed {
  id: string;
  author: string;
  authorMaxEntries: number;
  sources: FeedSource[];
}

// Individual feed source
export interface FeedSource {
  url: string;
  schedule: 'daily' | 'weekly' | 'monthly';
  maxEntries: number;
}

// RSS entry from workflow
export interface RssEntry {
  author: string;
  title: string;
  url: string;
  date: string;
}

// Configuration root
export interface Config {
  feeds: Feed[];
}
