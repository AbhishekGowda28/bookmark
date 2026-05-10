import { z } from 'zod';
import type { Link, Feed, FeedSource, RssEntry, Config } from '@bookmark/types';

/**
 * Zod schema for Link interface
 * Validates both bookmark and RSS links
 */
export const LinkSchema = z.object({
  id: z.string().min(1, 'Link ID cannot be empty'),
  title: z.string().min(1, 'Title cannot be empty'),
  url: z.string().url('Invalid URL format'),
  source: z.enum(['bookmark', 'rss']),
  feed: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  addedAt: z.string().datetime().optional(),
}) satisfies z.ZodType<Link>;

/**
 * Zod schema for FeedSource interface
 */
export const FeedSourceSchema = z.object({
  url: z.string().url('Feed source URL must be valid'),
  schedule: z.enum(['daily', 'weekly', 'monthly']),
  maxEntries: z.number().int().positive('Max entries must be a positive integer'),
}) satisfies z.ZodType<FeedSource>;

/**
 * Zod schema for Feed interface
 */
export const FeedSchema = z.object({
  id: z.string().min(1, 'Feed ID cannot be empty'),
  author: z.string().min(1, 'Author name cannot be empty'),
  authorMaxEntries: z.number().int().positive('Author max entries must be positive'),
  sources: z.array(FeedSourceSchema).min(1, 'At least one source is required'),
}) satisfies z.ZodType<Feed>;

/**
 * Zod schema for Config interface
 */
export const ConfigSchema = z.object({
  feeds: z.array(FeedSchema).min(1, 'At least one feed is required'),
}) satisfies z.ZodType<Config>;

/**
 * Zod schema for RssEntry interface
 */
export const RssEntrySchema = z.object({
  author: z.string().min(1, 'Author cannot be empty'),
  title: z.string().min(1, 'Title cannot be empty'),
  url: z.string().url('Invalid URL format'),
  date: z.string().datetime('Invalid date format'),
}) satisfies z.ZodType<RssEntry>;

// ============= Validation Functions =============

/**
 * Validates a Link object using Zod schema
 * @param data Unknown data to validate
 * @returns Validated Link object or throws ZodError
 */
export function validateLink(data: unknown): Link {
  return LinkSchema.parse(data);
}

/**
 * Type guard for Link validation
 */
export function isLink(data: unknown): data is Link {
  return LinkSchema.safeParse(data).success;
}

/**
 * Validates a Feed object
 */
export function validateFeed(data: unknown): Feed {
  return FeedSchema.parse(data);
}

/**
 * Type guard for Feed validation
 */
export function isFeed(data: unknown): data is Feed {
  return FeedSchema.safeParse(data).success;
}

/**
 * Validates a FeedSource object
 */
export function validateFeedSource(data: unknown): FeedSource {
  return FeedSourceSchema.parse(data);
}

/**
 * Type guard for FeedSource validation
 */
export function isFeedSource(data: unknown): data is FeedSource {
  return FeedSourceSchema.safeParse(data).success;
}

/**
 * Validates a Config object
 */
export function validateConfig(data: unknown): Config {
  return ConfigSchema.parse(data);
}

/**
 * Type guard for Config validation
 */
export function isConfig(data: unknown): data is Config {
  return ConfigSchema.safeParse(data).success;
}

/**
 * Validates an RssEntry object
 */
export function validateRssEntry(data: unknown): RssEntry {
  return RssEntrySchema.parse(data);
}

/**
 * Type guard for RssEntry validation
 */
export function isRssEntry(data: unknown): data is RssEntry {
  return RssEntrySchema.safeParse(data).success;
}

/**
 * Validates multiple links at once
 * @param data Unknown data to validate
 * @returns Validated Link[] or throws ZodError
 */
export function validateLinks(data: unknown): Link[] {
  return z.array(LinkSchema).parse(data);
}

/**
 * Safe parse: returns link on success, null on failure
 */
export function safeParseLinkOrNull(data: unknown): Link | null {
  const result = LinkSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Get validation errors for a Link
 * @param data Unknown data to validate
 * @returns Array of validation errors or empty array if valid
 */
export function getLinkValidationErrors(data: unknown): string[] {
  const result = LinkSchema.safeParse(data);
  if (result.success) return [];
  return result.error.issues.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`);
}

// ============= URL & Format Utilities =============

/**
 * Normalize URL for comparison (remove trailing slash, lowercase)
 */
export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
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
 * Check if two links are duplicates (same URL)
 */
export function isDuplicate(link1: Link, link2: Link): boolean {
  return normalizeUrl(link1.url) === normalizeUrl(link2.url);
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

// ============= ID Generation =============

/**
 * Generate UUID v4
 */
export function generateId(): string {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Ensure Link has valid ID
 */
export function ensureLink(link: Partial<Link>): Link {
  return {
    id: link.id || generateId(),
    title: link.title || 'Untitled',
    url: link.url || '',
    source: link.source || 'bookmark',
    feed: link.feed,
  };
}

// ============= Type Exports =============
export type { Link, Feed, FeedSource, RssEntry, Config };

export default {
  validateLink,
  isLink,
  validateFeed,
  isFeed,
  validateConfig,
  isConfig,
  validateRssEntry,
  isRssEntry,
  validateLinks,
  safeParseLinkOrNull,
  getLinkValidationErrors,
  normalizeUrl,
  isDuplicate,
  formatUrl,
  formatDate,
  generateId,
  ensureLink,
};
