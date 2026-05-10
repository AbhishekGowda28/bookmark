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
 * Validates individual feed sources in the configuration
 */
export const FeedSourceSchema = z.object({
  url: z.string().url('Feed source URL must be valid'),
  schedule: z.enum(['daily', 'weekly', 'monthly']),
  maxEntries: z.number().int().positive('Max entries must be a positive integer'),
}) satisfies z.ZodType<FeedSource>;

/**
 * Zod schema for Feed interface
 * Validates feed configuration with sources
 */
export const FeedSchema = z.object({
  id: z.string().min(1, 'Feed ID cannot be empty'),
  author: z.string().min(1, 'Author name cannot be empty'),
  authorMaxEntries: z.number().int().positive('Author max entries must be positive'),
  sources: z.array(FeedSourceSchema).min(1, 'At least one source is required'),
}) satisfies z.ZodType<Feed>;

/**
 * Zod schema for Config interface
 * Validates the entire feeds.json configuration
 */
export const ConfigSchema = z.object({
  feeds: z.array(FeedSchema).min(1, 'At least one feed is required'),
}) satisfies z.ZodType<Config>;

/**
 * Zod schema for RssEntry interface
 * Validates RSS entries from workflow
 */
export const RssEntrySchema = z.object({
  author: z.string().min(1, 'Author cannot be empty'),
  title: z.string().min(1, 'Title cannot be empty'),
  url: z.string().url('Invalid URL format'),
  date: z.string().datetime('Invalid date format'),
}) satisfies z.ZodType<RssEntry>;

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
 * @param data Unknown data to check
 * @returns true if data is valid Link
 */
export function isLink(data: unknown): data is Link {
  return LinkSchema.safeParse(data).success;
}

/**
 * Validates a Feed object using Zod schema
 * @param data Unknown data to validate
 * @returns Validated Feed object or throws ZodError
 */
export function validateFeed(data: unknown): Feed {
  return FeedSchema.parse(data);
}

/**
 * Type guard for Feed validation
 * @param data Unknown data to check
 * @returns true if data is valid Feed
 */
export function isFeed(data: unknown): data is Feed {
  return FeedSchema.safeParse(data).success;
}

/**
 * Validates a FeedSource object using Zod schema
 * @param data Unknown data to validate
 * @returns Validated FeedSource object or throws ZodError
 */
export function validateFeedSource(data: unknown): FeedSource {
  return FeedSourceSchema.parse(data);
}

/**
 * Type guard for FeedSource validation
 * @param data Unknown data to check
 * @returns true if data is valid FeedSource
 */
export function isFeedSource(data: unknown): data is FeedSource {
  return FeedSourceSchema.safeParse(data).success;
}

/**
 * Validates a Config object using Zod schema
 * @param data Unknown data to validate
 * @returns Validated Config object or throws ZodError
 */
export function validateConfig(data: unknown): Config {
  return ConfigSchema.parse(data);
}

/**
 * Type guard for Config validation
 * @param data Unknown data to check
 * @returns true if data is valid Config
 */
export function isConfig(data: unknown): data is Config {
  return ConfigSchema.safeParse(data).success;
}

/**
 * Validates an RssEntry object using Zod schema
 * @param data Unknown data to validate
 * @returns Validated RssEntry object or throws ZodError
 */
export function validateRssEntry(data: unknown): RssEntry {
  return RssEntrySchema.parse(data);
}

/**
 * Type guard for RssEntry validation
 * @param data Unknown data to check
 * @returns true if data is valid RssEntry
 */
export function isRssEntry(data: unknown): data is RssEntry {
  return RssEntrySchema.safeParse(data).success;
}

/**
 * Validates multiple links at once
 * @param data Unknown data to validate
 * @returns Array of validated Links or throws ZodError
 */
export function validateLinks(data: unknown): Link[] {
  return z.array(LinkSchema).parse(data);
}

/**
 * Safely validates a Link, returning result or null
 * @param data Unknown data to validate
 * @returns Validated Link or null if invalid
 */
export function safeParseLinkOrNull(data: unknown): Link | null {
  const result = LinkSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Get detailed validation errors
 * @param data Unknown data to validate against LinkSchema
 * @returns Array of error messages or empty if valid
 */
export function getLinkValidationErrors(data: unknown): string[] {
  const result = LinkSchema.safeParse(data);
  if (result.success) return [];
  return result.error?.issues?.map((e) => `${e.path.join('.')}: ${e.message}`) || [];
}

export default {
  LinkSchema,
  FeedSchema,
  FeedSourceSchema,
  ConfigSchema,
  RssEntrySchema,
  validateLink,
  isLink,
  validateFeed,
  isFeed,
  validateFeedSource,
  isFeedSource,
  validateConfig,
  isConfig,
  validateRssEntry,
  isRssEntry,
  validateLinks,
  safeParseLinkOrNull,
  getLinkValidationErrors,
};
